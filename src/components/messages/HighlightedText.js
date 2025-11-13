import PropTypes from 'prop-types';
import React from 'react';

/**
 * Component to highlight search terms in text
 */
function HighlightedText({ text, searchQuery }) {
  if (!searchQuery || !text) {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        // Create a stable key using part content and index
        const key = `${part}-${index}`;

        return isMatch ? (
          <mark
            key={key}
            className='bg-yellow-200 text-gray-900 rounded px-0.5'
          >
            {part}
          </mark>
        ) : (
          <span key={key}>{part}</span>
        );
      })}
    </span>
  );
}

HighlightedText.propTypes = {
  text: PropTypes.string,
  searchQuery: PropTypes.string,
};

export default HighlightedText;
