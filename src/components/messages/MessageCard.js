import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import RichTextRenderer from './RichTextRenderer';
import RichTextEditor, {
  jsonToSlate,
  slateToJSON,
  slateToPlainText
} from './RichTextEditor';
import MessageStatusIndicator from '../common/MessageStatusIndicator';
import MessageReactions from './MessageReactions';
import EmojiPicker from '../common/EmojiPicker';
import ImageViewerModal from './ImageViewerModal';
import LinkPreview from './LinkPreview';
import HighlightedText from './HighlightedText';

function MessageCard({ message, isOwnMessage, showAvatar, currentUserId, onReply, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, onReact, onPin, onForward, searchQuery, isHighlighted }) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  const handleAddReaction = (emoji) => {
    if (onReact) {
      onReact(message.id, emoji, 'add');
    }
  };

  const handleRemoveReaction = (emoji) => {
    if (onReact) {
      onReact(message.id, emoji, 'remove');
    }
  };

  const handleOpenImageViewer = (index) => {
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  };

  // Get only image attachments for the viewer
  const imageAttachments = message.attachments?.filter(att => att.type === 'image') || [];

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
                <div className="w-full space-y-2" style={{ minWidth: '320px' }}>
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
                      'px-4 py-2.5 rounded-message relative transition-all',
                      isOwnMessage
                        ? 'bg-primary-light text-gray-900 rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm',
                      isHighlighted && 'ring-2 ring-yellow-400 shadow-lg'
                    )}
                  >
                    {/* Pinned Indicator */}
                    {message.isPinned && (
                      <div className="absolute top-1 right-1">
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                    )}

                    {/* Forwarded Indicator */}
                    {message.isForwarded && (
                      <div className="mb-2 pb-2 border-b border-gray-300">
                        <div className="flex items-center space-x-1 text-xs text-gray-500 italic">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span>Forwarded from {message.forwardedFrom?.senderName}</span>
                        </div>
                      </div>
                    )}

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
                    {message.text && <RichTextRenderer content={message.text} />}

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, index) => {
                          // Get image index for the viewer
                          const imageIndex = imageAttachments.findIndex(img => img.url === attachment.url);

                          return (
                            <div key={index}>
                              {attachment.type === 'image' ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => handleOpenImageViewer(imageIndex)}
                                />
                              ) : (
                                <a
                                  href={attachment.url}
                                  download={attachment.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                                    <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Link Previews */}
                    {message.linkPreviews && message.linkPreviews.length > 0 && (
                      <div className="space-y-2">
                        {message.linkPreviews.map((preview, index) => (
                          <LinkPreview
                            key={index}
                            url={preview.url}
                            title={preview.title}
                            description={preview.description}
                            image={preview.image}
                            favicon={preview.favicon}
                          />
                        ))}
                      </div>
                    )}

                    {/* Message Reactions */}
                    <MessageReactions
                      reactions={message.reactions}
                      currentUserId={currentUserId}
                      onAddReaction={handleAddReaction}
                      onRemoveReaction={handleRemoveReaction}
                    />
                  </div>

                  {/* Action Buttons (shown on hover) */}
                  {showActions && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Reaction Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Add reaction"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-full left-0 mb-2 z-20">
                            <EmojiPicker
                              onEmojiSelect={handleAddReaction}
                              onClose={() => setShowEmojiPicker(false)}
                            />
                          </div>
                        )}
                      </div>

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

                      {/* Pin Button */}
                      {onPin && (
                        <button
                          onClick={() => onPin(message.id, !message.isPinned)}
                          className={clsx(
                            'p-1.5 rounded transition-colors',
                            message.isPinned
                              ? 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                              : 'hover:bg-gray-200 text-gray-600'
                          )}
                          title={message.isPinned ? 'Unpin message' : 'Pin message'}
                        >
                          <svg className="w-4 h-4" fill={message.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      )}

                      {/* Forward Button */}
                      {onForward && (
                        <button
                          onClick={() => onForward(message)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Forward message"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      )}

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

            {/* Timestamp, Status, and Edited Label */}
            <div className="flex items-center space-x-2 mt-1 px-2">
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.createdAt)}
              </span>
              {message.editedAt && (
                <span className="text-xs text-gray-500 italic">Edited</span>
              )}
              {/* Show status indicator for own messages */}
              {isOwnMessage && (
                <MessageStatusIndicator
                  status={message.status}
                  readBy={message.readBy}
                  deliveredTo={message.deliveredTo}
                  currentUserId={currentUserId}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        images={imageAttachments}
        initialIndex={selectedImageIndex}
      />
    </div>
  );
}

export default MessageCard;
