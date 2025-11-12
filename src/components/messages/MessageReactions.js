import React, { useState } from 'react';
import clsx from 'clsx';

/**
 * Displays emoji reactions on a message
 * Shows count and list of users who reacted
 */
function MessageReactions({ reactions = {}, currentUserId, onAddReaction, onRemoveReaction }) {
  const [showTooltip, setShowTooltip] = useState(null);

  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = {};
  Object.entries(reactions).forEach(([userId, reaction]) => {
    const emoji = reaction.emoji;
    if (!groupedReactions[emoji]) {
      groupedReactions[emoji] = {
        emoji,
        users: [],
        count: 0,
        hasCurrentUser: false,
      };
    }
    groupedReactions[emoji].users.push({
      userId,
      userName: reaction.userName,
    });
    groupedReactions[emoji].count++;
    if (userId === currentUserId) {
      groupedReactions[emoji].hasCurrentUser = true;
    }
  });

  const handleReactionClick = (emoji, hasCurrentUser) => {
    if (hasCurrentUser) {
      // Remove reaction
      onRemoveReaction(emoji);
    } else {
      // Add reaction
      onAddReaction(emoji);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.values(groupedReactions).map(({ emoji, count, users, hasCurrentUser }) => (
        <div
          key={emoji}
          className="relative"
          onMouseEnter={() => setShowTooltip(emoji)}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <button
            onClick={() => handleReactionClick(emoji, hasCurrentUser)}
            className={clsx(
              'flex items-center space-x-1 px-2 py-0.5 rounded-full text-sm border transition-colors',
              hasCurrentUser
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span>{emoji}</span>
            <span className="text-xs font-medium">{count}</span>
          </button>

          {/* Tooltip showing who reacted */}
          {showTooltip === emoji && (
            <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {users.map((user, idx) => (
                <div key={user.userId}>
                  {user.userName}
                  {idx < users.length - 1 && ', '}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MessageReactions;
