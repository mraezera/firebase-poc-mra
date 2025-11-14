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
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);
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

  const handleImageSelect = e => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    // Create preview URLs
    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const handleFileSelect = e => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeImage = index => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);

      return newImages;
    });
  };

  const removeFile = index => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);

      return newFiles;
    });
  };

  // Drag and drop handlers
  const handleDragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the drop zone entirely
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      return;
    }

    // Separate images and other files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const otherFiles = files.filter(file => !file.type.startsWith('image/'));

    // Add images with previews
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));
      setSelectedImages(prev => [...prev, ...newImages]);
    }

    // Add other files
    if (otherFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...otherFiles]);
    }
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
        {/* Attachment Buttons */}
        <div className='flex space-x-2'>
          {/* Image Button */}
          <button
            type='button'
            onClick={() => imageInputRef.current?.click()}
            className='p-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors flex items-center justify-center h-[44px] w-[44px]'
            title='Attach image'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          </button>

          {/* File Button */}
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            className='p-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors flex items-center justify-center h-[44px] w-[44px]'
            title='Attach file'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
              />
            </svg>
          </button>

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type='file'
            accept='image/*'
            multiple
            onChange={handleImageSelect}
            className='hidden'
          />
          <input
            ref={fileInputRef}
            type='file'
            multiple
            onChange={handleFileSelect}
            className='hidden'
          />
        </div>

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
