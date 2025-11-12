import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

function ConversationCard({ conversation, currentUserId, isSelected, onClick }) {
  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    const otherUserData = conversation.participantsData?.[otherUserId];
    return otherUserData?.displayName || 'Unknown User';
  };

  const getConversationPhoto = () => {
    if (conversation.type === 'group') {
      return conversation.photoURL || null;
    }

    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    const otherUserData = conversation.participantsData?.[otherUserId];
    return otherUserData?.photoURL || null;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  const conversationName = getConversationName();
  const photoURL = getConversationPhoto();
  const lastMessage = conversation.lastMessage;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'px-4 py-3 cursor-pointer transition-colors border-l-4',
        isSelected
          ? 'bg-primary-light border-primary'
          : 'bg-transparent border-transparent hover:bg-gray-50'
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {photoURL ? (
            <img
              src={photoURL}
              alt={conversationName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
              {getInitials(conversationName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {conversationName}
            </h3>
            {lastMessage?.createdAt && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatTimestamp(lastMessage.createdAt)}
              </span>
            )}
          </div>

          {lastMessage && (
            <p className="text-sm text-gray-600 truncate">
              {lastMessage.type === 'deleted' ? (
                <span className="italic">Message deleted</span>
              ) : (
                <>
                  {lastMessage.senderId === currentUserId && (
                    <span className="text-gray-500">You: </span>
                  )}
                  {lastMessage.plainText || lastMessage.text || 'New message'}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationCard;
