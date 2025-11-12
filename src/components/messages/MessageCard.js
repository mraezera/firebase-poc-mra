import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import RichTextRenderer from './RichTextRenderer';
import RichTextEditor, {
  jsonToSlate,
  slateToJSON,
  slateToPlainText
} from './RichTextEditor';

function MessageCard({ message, isOwnMessage, showAvatar, currentUserId, onReply, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit }) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [editValue, setEditValue] = useState(() =>
    isEditing ? jsonToSlate(message.text) : null
  );

  // Update editValue when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(jsonToSlate(message.text));
    }
  }, [isEditing, message.text]);
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = () => {
    if (editValue) {
      const richText = slateToJSON(editValue);
      const plainText = slateToPlainText(editValue);
      onSaveEdit(message.id, richText, plainText);
    }
  };

  const handleCancel = () => {
    setEditValue(jsonToSlate(message.text));
    onCancelEdit();
  };

  const handleDelete = (deleteForEveryone) => {
    setShowDeleteMenu(false);
    onDelete(message.id, deleteForEveryone);
  };

  // Show "deleted" message if deleted for everyone
  if (message.deletedAt) {
    return (
      <div className={clsx('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
        <div className="max-w-md px-4 py-2 rounded-message bg-gray-100 border border-gray-200">
          <p className="text-sm text-gray-500 italic">This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx('flex group', isOwnMessage ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={clsx('flex', isEditing ? 'max-w-6xl w-full' : 'max-w-2xl', isOwnMessage ? 'flex-row-reverse' : 'flex-row')}>
        {/* Avatar */}
        <div className={clsx('flex-shrink-0', isOwnMessage ? 'ml-3' : 'mr-3')}>
          {showAvatar ? (
            message.senderPhotoURL ? (
              <img
                src={message.senderPhotoURL}
                alt={message.senderName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(message.senderName)}
              </div>
            )
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>

        {/* Message Bubble and Actions Container */}
        <div className="flex flex-col">
          <div className={clsx('flex flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
            {/* Sender Name (only for group chats and received messages) */}
            {!isOwnMessage && showAvatar && (
              <span className="text-xs text-gray-600 mb-1 px-2">
                {message.senderName}
              </span>
            )}

            {/* Message Content and Action Buttons Row */}
            <div className={clsx('flex items-center gap-2', isOwnMessage ? 'flex-row-reverse' : 'flex-row')}>
              {/* Message Content */}
              {isEditing ? (
                <div className="w-full space-y-2">
                  <RichTextEditor
                    value={editValue}
                    onChange={setEditValue}
                    onSubmit={handleSave}
                    placeholder="Edit message..."
                    editorKey={`edit-${message.id}`}
                    variant="large"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={clsx(
                      'px-4 py-2.5 rounded-message relative',
                      isOwnMessage
                        ? 'bg-primary-light text-gray-900 rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    )}
                  >
                    {/* Reply Preview */}
                    {message.replyTo && (
                      <div className="mb-2 pb-2 border-b border-gray-300 opacity-70">
                        <p className="text-xs font-semibold text-gray-600 mb-0.5">
                          {message.replyTo.senderName}
                        </p>
                        <p className="text-xs text-gray-600 truncate max-w-sm">
                          {message.replyTo.plainText}
                        </p>
                      </div>
                    )}

                    {/* Message Text with Rich Formatting */}
                    <RichTextRenderer content={message.text} />
                  </div>

                  {/* Action Buttons (shown on hover) */}
                  {showActions && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Reply Button */}
                      <button
                        onClick={() => onReply(message)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Reply"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>

                      {/* Edit Button (only for own messages) */}
                      {isOwnMessage && (
                        <button
                          onClick={() => onEdit(message)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Delete Button (only for own messages) */}
                      {isOwnMessage && (
                        <div className="relative">
                          <button
                            onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          {/* Delete Menu */}
                          {showDeleteMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 whitespace-nowrap">
                              <button
                                onClick={() => handleDelete(false)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Delete for me
                              </button>
                              <button
                                onClick={() => handleDelete(true)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete for everyone
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Timestamp and Edited Label */}
            <div className="flex items-center space-x-2 mt-1 px-2">
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.createdAt)}
              </span>
              {message.editedAt && (
                <span className="text-xs text-gray-500 italic">Edited</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageCard;
