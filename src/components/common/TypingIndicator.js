import PropTypes from 'prop-types';
import React from 'react';

/**
 * Shows typing indicator with animated dots
 */
function TypingIndicator({ typingUsers = [] }) {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className='px-6 py-2 text-sm text-gray-600 flex items-center space-x-2'>
      <span>{getTypingText()}</span>
      <div className='flex space-x-1'>
        <div
          className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
          style={{ animationDelay: '0ms' }}
        />
        <div
          className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
          style={{ animationDelay: '150ms' }}
        />
        <div
          className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

TypingIndicator.propTypes = {
  typingUsers: PropTypes.arrayOf(
    PropTypes.shape({
      displayName: PropTypes.string,
    })
  ),
};

export default TypingIndicator;
