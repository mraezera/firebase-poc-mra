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
        return isMatch ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}

export default HighlightedText;
