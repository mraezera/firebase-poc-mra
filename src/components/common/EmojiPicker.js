import React from 'react';

/**
 * Simple emoji picker with common reaction emojis
 */
function EmojiPicker({ onEmojiSelect, onClose }) {
  const commonEmojis = [
    { emoji: '👍', name: 'thumbs up' },
    { emoji: '❤️', name: 'heart' },
    { emoji: '😂', name: 'laughing' },
    { emoji: '😮', name: 'wow' },
    { emoji: '😢', name: 'sad' },
    { emoji: '🙏', name: 'pray' },
    { emoji: '🎉', name: 'party' },
    { emoji: '🔥', name: 'fire' },
    { emoji: '👏', name: 'clap' },
    { emoji: '✅', name: 'check' },
    { emoji: '💯', name: 'hundred' },
    { emoji: '🚀', name: 'rocket' },
  ];

  const handleEmojiClick = emoji => {
    onEmojiSelect(emoji);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 min-w-[240px]'>
      {commonEmojis.map(({ emoji, name }) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className='w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors'
          title={name}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default EmojiPicker;
