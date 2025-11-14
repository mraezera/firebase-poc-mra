import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import MessageCard from './MessageCard';

function MessageList({
  messages,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onForward,
  editingMessage,
  onSaveEdit,
  onCancelEdit,
  searchQuery,
  highlightedMessageId,
}) {
  const parentRef = useRef(null);

  const scrollToBottom = () => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatDateHeader = timestamp => {
    if (!timestamp) {
      return '';
    }

    try {
      const date = timestamp.toDate();

      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (error) {
      return '';
    }
  };

  const shouldShowDateHeader = (currentMessage, previousMessage) => {
    if (!currentMessage.createdAt) {
      return false;
    }
    if (!previousMessage || !previousMessage.createdAt) {
      return true;
    }

    try {
      const currentDate = currentMessage.createdAt.toDate();
      const previousDate = previousMessage.createdAt.toDate();

      return !isSameDay(currentDate, previousDate);
    } catch (error) {
      return false;
    }
  };

  // Filter out messages deleted for current user
  const visibleMessages = messages.filter(msg => !(msg.deletedFor && msg.deletedFor.includes(currentUserId)));

  // Prepare items for virtualization (messages + date headers)
  const items = [];
  visibleMessages.forEach((message, index) => {
    const previousMessage = index > 0 ? visibleMessages[index - 1] : null;
    const showDateHeader = shouldShowDateHeader(message, previousMessage);

    if (showDateHeader) {
      items.push({
        type: 'date-header',
        id: `date-${message.id}`,
        timestamp: message.createdAt,
      });
    }

    items.push({
      type: 'message',
      message,
      index,
    });
  });

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of a message
    overscan: 5,
  });

  if (visibleMessages.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center text-gray-500'>
          <p>No messages yet</p>
          <p className='text-sm mt-1'>Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className='h-full overflow-y-auto px-6 py-4'
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const item = items[virtualItem.index];

          if (item.type === 'date-header') {
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className='flex items-center justify-center my-4'>
                  <div className='bg-gray-200 rounded-full px-4 py-1'>
                    <span className='text-xs font-medium text-gray-600'>{formatDateHeader(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          }

          // Message item
          const { message, index } = item;
          const isOwnMessage = message.senderId === currentUserId;
          const previousMessage = index > 0 ? visibleMessages[index - 1] : null;
          const nextMessage = index < visibleMessages.length - 1 ? visibleMessages[index + 1] : null;

          const showAvatar =
            !isOwnMessage &&
            (index === 0 ||
              !previousMessage ||
              previousMessage.senderId !== message.senderId ||
              shouldShowDateHeader(message, previousMessage));

          const isGrouped =
            nextMessage && nextMessage.senderId === message.senderId && !shouldShowDateHeader(nextMessage, message);

          // Check if message has reactions or is forwarded to add extra spacing
          const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
          const isForwarded = message.isForwarded;

          // Determine margin based on grouping, reactions, and forwarded status
          // Ensure there's always adequate spacing to prevent overlap
          let marginClass = 'mb-6'; // default spacing for different senders
          if (isGrouped) {
            // Same sender back-to-back messages need spacing too
            marginClass = hasReactions || isForwarded ? 'mb-6' : 'mb-4';
          } else if (hasReactions || isForwarded) {
            // Different sender with reactions/forwarded needs more space
            marginClass = 'mb-8';
          }

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={marginClass}
            >
              <MessageCard
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                currentUserId={currentUserId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                onPin={onPin}
                onForward={onForward}
                isEditing={editingMessage?.id === message.id}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                searchQuery={searchQuery}
                isHighlighted={message.id === highlightedMessageId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onReply: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReact: PropTypes.func.isRequired,
  onPin: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired,
  editingMessage: PropTypes.object,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
  highlightedMessageId: PropTypes.string,
};

export default MessageList;
