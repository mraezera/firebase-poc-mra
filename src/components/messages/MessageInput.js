import React, { useState } from 'react';
import clsx from 'clsx';
import RichTextEditor, {
  createEmptySlateValue,
  isSlateEmpty,
  slateToPlainText,
  slateToJSON
} from './RichTextEditor';

function MessageInput({ onSendMessage, replyTo, onCancelReply }) {
  const [editorValue, setEditorValue] = useState(() => createEmptySlateValue());

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!isSlateEmpty(editorValue)) {
      const plainText = slateToPlainText(editorValue);
      const richText = slateToJSON(editorValue);

      onSendMessage({
        plainText,
        richText,
        replyTo
      });

      // Reset editor
      setEditorValue(createEmptySlateValue());

      // Clear reply
      if (onCancelReply) {
        onCancelReply();
      }
    }
  };

  const isEmpty = isSlateEmpty(editorValue);

  return (
    <div className="bg-background-card border-t border-gray-200 px-6 py-4 flex-shrink-0">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-primary flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 font-semibold mb-1">
              Replying to {replyTo.senderName}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {replyTo.plainText}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Cancel reply"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Rich Text Editor */}
        <div className="flex-1">
          <RichTextEditor
            value={editorValue}
            onChange={setEditorValue}
            onSubmit={handleSubmit}
            placeholder="Type a message... (Ctrl+B for bold, Ctrl+I for italic)"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isEmpty}
          className={clsx(
            'px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2',
            !isEmpty
              ? 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Send</span>
        </button>
      </form>

      {/* Formatting Hint */}
      <div className="mt-2 text-xs text-gray-500">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}

export default MessageInput;
