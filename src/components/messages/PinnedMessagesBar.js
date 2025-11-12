import React, { useState } from 'react';
import clsx from 'clsx';

/**
 * Displays pinned messages at the top of the conversation
 * Shows carousel of pinned messages with navigation
 */
function PinnedMessagesBar({ pinnedMessages, onUnpin, onScrollToMessage }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  const currentMessage = pinnedMessages[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < pinnedMessages.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleUnpin = (e) => {
    e.stopPropagation();
    if (onUnpin) {
      onUnpin(currentMessage.id, false);
      // If we're at the last message and unpinning, go back one
      if (currentIndex > 0 && currentIndex === pinnedMessages.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleClick = () => {
    if (onScrollToMessage) {
      onScrollToMessage(currentMessage.id);
    }
  };

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
          {/* Pin Icon */}
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>

          {/* Message Preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline space-x-2">
              <span className="text-xs font-semibold text-blue-700">
                {currentMessage.senderName}
              </span>
              {pinnedMessages.length > 1 && (
                <span className="text-xs text-blue-600">
                  {currentIndex + 1} of {pinnedMessages.length}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 truncate">
              {currentMessage.plainText}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          {/* Navigation buttons */}
          {pinnedMessages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className={clsx(
                  'p-1 rounded transition-colors',
                  hasPrevious
                    ? 'hover:bg-blue-100 text-blue-600'
                    : 'text-gray-400 cursor-not-allowed'
                )}
                title="Previous pinned message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className={clsx(
                  'p-1 rounded transition-colors',
                  hasNext
                    ? 'hover:bg-blue-100 text-blue-600'
                    : 'text-gray-400 cursor-not-allowed'
                )}
                title="Next pinned message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Unpin button */}
          <button
            onClick={handleUnpin}
            className="p-1 hover:bg-blue-100 rounded transition-colors text-blue-600"
            title="Unpin message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinnedMessagesBar;
