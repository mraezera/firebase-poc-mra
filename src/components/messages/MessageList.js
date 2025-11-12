import React, { useEffect, useRef } from 'react';
import MessageCard from './MessageCard';

function MessageList({ messages, currentUserId, onReply }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>No messages yet</p>
          <p className="text-sm mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const showAvatar = !isOwnMessage && (
            index === 0 ||
            messages[index - 1].senderId !== message.senderId
          );

          return (
            <MessageCard
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              showAvatar={showAvatar}
              currentUserId={currentUserId}
              onReply={onReply}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default MessageList;
