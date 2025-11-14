import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Transforms } from 'slate';
import { ReactEditor } from 'slate-react';

import { presenceService } from '../../services/presenceService';
import EmojiPicker from '../common/EmojiPicker';
import RichTextEditor, { createEmptySlateValue, isSlateEmpty, slateToJSON, slateToPlainText } from './RichTextEditor';

function MessageInput({ onSendMessage, replyTo, onCancelReply, conversationId }) {
  const [editorValue, setEditorValue] = useState(() => createEmptySlateValue());
  const [editorKey, setEditorKey] = useState(0);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const emojiPickerRef = useRef(null);
  const editorRef = useRef(null);

  // Handle typing indicators
  const handleEditorChange = value => {
    setEditorValue(value);

    if (!conversationId) {
      return;
    }

    // Set typing status to true
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      presenceService.setTypingStatus(conversationId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing status after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      presenceService.setTypingStatus(conversationId, false);
    }, 3000);
  };

  // Clean up typing status on unmount
  useEffect(() => {
    return () => {
      if (conversationId && isTypingRef.current) {
        presenceService.setTypingStatus(conversationId, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  // Handle clicks outside emoji picker to close it
  useEffect(() => {
    const handleClickOutside = event => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEmojiPickerOpen]);

  const handleEmojiSelect = emoji => {
    if (editorRef.current) {
      const editor = editorRef.current.getEditor();

      try {
        // Focus the editor first
        ReactEditor.focus(editor);

        // Insert the emoji at the current cursor position
        Transforms.insertText(editor, emoji);
      } catch (error) {
        console.error('Error inserting emoji:', error);
      }
    }

    // Close the emoji picker
    setIsEmojiPickerOpen(false);
  };

  const handleSubmit = e => {
    if (e) {
      e.preventDefault();
    }

    const hasText = !isSlateEmpty(editorValue);

    if (hasText) {
      const plainText = slateToPlainText(editorValue);
      const richText = slateToJSON(editorValue);

      onSendMessage({
        plainText,
        richText,
        replyTo,
      });

      // Clear typing status
      if (conversationId && isTypingRef.current) {
        isTypingRef.current = false;
        presenceService.setTypingStatus(conversationId, false);
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Reset editor by changing key (forces remount)
      setEditorValue(createEmptySlateValue());
      const newKey = editorKey + 1;
      setEditorKey(newKey);

      // Focus editor after it remounts
      setTimeout(() => {
        if (editorRef.current) {
          try {
            const editor = editorRef.current.getEditor();
            ReactEditor.focus(editor);
            const end = { path: [0, 0], offset: 0 };
            editor.selection = { anchor: end, focus: end };
          } catch (err) {
            console.error('Error focusing editor after send:', err);
          }
        }
      }, 100);

      // Clear reply
      if (onCancelReply) {
        onCancelReply();
      }
    }
  };

  const isEmpty = isSlateEmpty(editorValue);

  return (
    <div className='bg-background-card border-t border-gray-200 px-6 py-4 flex-shrink-0'>
      {/* Reply Preview */}
      {replyTo && (
        <div className='mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-primary flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <p className='text-xs text-gray-600 font-semibold mb-1'>Replying to {replyTo.senderName}</p>
            <p className='text-sm text-gray-700 truncate'>{replyTo.plainText}</p>
          </div>
          <button
            onClick={onCancelReply}
            className='ml-2 p-1 hover:bg-gray-200 rounded transition-colors'
            title='Cancel reply'
          >
            <svg
              className='w-4 h-4 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className='flex items-center space-x-3'
      >
        {/* Rich Text Editor */}
        <div className='flex-1'>
          <RichTextEditor
            ref={editorRef}
            value={editorValue}
            onChange={handleEditorChange}
            onSubmit={handleSubmit}
            placeholder='Type a message... (Ctrl+B for bold, Ctrl+I for italic)'
            editorKey={editorKey}
            autoFocus={true}
          />
        </div>

        {/* Emoji Picker Button */}
        <div className='relative'>
          <button
            type='button'
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className='p-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors flex items-center justify-center h-[44px] w-[44px]'
            title='Add emoji'
          >
            <svg
              className='w-6 h-6 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </button>

          {/* Emoji Picker Popup */}
          {isEmojiPickerOpen && (
            <div
              ref={emojiPickerRef}
              className='absolute bottom-full right-0 mb-2 z-50'
            >
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type='submit'
          disabled={isEmpty}
          className={clsx(
            'px-6 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 h-[44px]',
            !isEmpty
              ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
            />
          </svg>
          <span>Send</span>
        </button>
      </form>

      {/* Formatting Hint */}
      <div className='mt-2 text-xs text-gray-500'>
        Press <kbd className='px-1.5 py-0.5 bg-gray-200 rounded'>Enter</kbd> to send,{' '}
        <kbd className='px-1.5 py-0.5 bg-gray-200 rounded'>Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  replyTo: PropTypes.object,
  onCancelReply: PropTypes.func.isRequired,
  conversationId: PropTypes.string.isRequired,
};

export default MessageInput;
