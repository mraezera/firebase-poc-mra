import {
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { db } from '../../firebase/config';
import { presenceService } from '../../services/presenceService';
import { generateLinkPreviews } from '../../utils/linkPreview';
import OnlineStatusIndicator from '../common/OnlineStatusIndicator';
import TypingIndicator from '../common/TypingIndicator';
import ForwardMessageModal from './ForwardMessageModal';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import PinnedMessagesBar from './PinnedMessagesBar';
import SearchBar from './SearchBar';

function ConversationArea({ user, conversation, onToggleRightPanel }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Track which messages have been processed to avoid infinite loops
  const processedMessagesRef = useRef(new Set());

  // Filter pinned messages
  const pinnedMessages = useMemo(() => {
    return messages
      .filter(msg => msg.isPinned)
      .sort((a, b) => {
        // Sort by pinnedAt timestamp, most recent first
        if (!a.pinnedAt || !b.pinnedAt) {
          return 0;
        }

        return b.pinnedAt.toMillis() - a.pinnedAt.toMillis();
      });
  }, [messages]);

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      // Clear processed messages when conversation changes
      processedMessagesRef.current.clear();

      return;
    }

    setLoading(true);
    const messagesRef = collection(db, `conversations/${conversation.id}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const messageData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .reverse();
        setMessages(messageData);
        setLoading(false);
      },
      error => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    // Mark conversation as read (reset unread count)
    const markAsRead = async () => {
      try {
        const conversationRef = doc(db, 'conversations', conversation.id);
        await updateDoc(conversationRef, {
          [`unreadCount.${user.uid}`]: 0,
        });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    };

    markAsRead();

    // Subscribe to typing indicators
    const unsubscribeTyping = presenceService.subscribeToTypingIndicators(conversation.id, user.uid, setTypingUsers);

    return () => {
      unsubscribe();
      unsubscribeTyping();
    };
  }, [conversation, user.uid]);

  // Separate effect for marking messages as delivered/read
  // Only runs when message IDs change, not when message content changes
  useEffect(() => {
    if (!conversation || messages.length === 0) {
      return;
    }

    const markMessagesAsDelivered = async () => {
      try {
        const undeliveredMessages = messages.filter(
          msg =>
            msg.senderId !== user.uid &&
            (!msg.deliveredTo || !msg.deliveredTo[user.uid]) &&
            !processedMessagesRef.current.has(`delivered-${msg.id}`)
        );

        if (undeliveredMessages.length > 0) {
          const batch = [];
          undeliveredMessages.forEach(msg => {
            const messageRef = doc(db, `conversations/${conversation.id}/messages`, msg.id);
            batch.push(
              updateDoc(messageRef, {
                [`deliveredTo.${user.uid}`]: serverTimestamp(),
                status: 'delivered',
              })
            );
            // Mark as processed
            processedMessagesRef.current.add(`delivered-${msg.id}`);
          });

          await Promise.all(batch);
        }
      } catch (error) {
        console.error('Error marking messages as delivered:', error);
      }
    };

    const markMessagesAsRead = async () => {
      try {
        const unreadMessages = messages.filter(
          msg =>
            msg.senderId !== user.uid &&
            (!msg.readBy || !msg.readBy[user.uid]) &&
            !processedMessagesRef.current.has(`read-${msg.id}`)
        );

        if (unreadMessages.length > 0) {
          const batch = [];
          unreadMessages.forEach(msg => {
            const messageRef = doc(db, `conversations/${conversation.id}/messages`, msg.id);
            batch.push(
              updateDoc(messageRef, {
                [`readBy.${user.uid}`]: serverTimestamp(),
              })
            );
            // Mark as processed
            processedMessagesRef.current.add(`read-${msg.id}`);
          });

          await Promise.all(batch);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsDelivered();
    markMessagesAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, user.uid, messages.map(m => m.id).join(',')]); // Only trigger when message IDs change

  const handleSendMessage = async messageData => {
    if (!conversation) {
      return;
    }

    const { plainText, richText, replyTo: replyToMessage } = messageData;

    // Must have text
    if (!plainText || !plainText.trim()) {
      return;
    }

    try {
      const messagesRef = collection(db, `conversations/${conversation.id}/messages`);

      // Generate link previews from text
      let linkPreviews = [];
      if (plainText && plainText.trim()) {
        try {
          linkPreviews = await generateLinkPreviews(plainText);
        } catch (error) {
          console.error('Error generating link previews:', error);
          // Continue without link previews if generation fails
        }
      }

      // Message type is always text
      const messageType = 'text';

      const newMessage = {
        text: richText || null,
        plainText: plainText?.trim() || '',
        type: messageType,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhotoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        editedAt: null,
        deletedAt: null,
        deletedFor: [],
        replyTo: replyToMessage
          ? {
              messageId: replyToMessage.id,
              text: replyToMessage.text || replyToMessage.plainText,
              plainText: replyToMessage.plainText,
              senderId: replyToMessage.senderId,
              senderName: replyToMessage.senderName,
            }
          : null,
        attachments: [],
        linkPreviews,
        // Message status tracking
        status: 'sent',
        readBy: {},
        deliveredTo: {
          [user.uid]: serverTimestamp(), // Mark as delivered to sender immediately
        },
      };

      await addDoc(messagesRef, newMessage);

      // Update conversation's lastMessage and increment unread counts
      const conversationRef = doc(db, 'conversations', conversation.id);

      // Build unread count updates for all participants except sender
      const unreadUpdates = {};
      conversation.participants.forEach(participantId => {
        if (participantId !== user.uid) {
          unreadUpdates[`unreadCount.${participantId}`] = increment(1);
        }
      });

      const lastMessageText = plainText?.trim() || '';

      await updateDoc(conversationRef, {
        lastMessage: {
          text: lastMessageText,
          plainText: lastMessageText,
          senderId: user.uid,
          senderName: user.displayName,
          createdAt: serverTimestamp(),
          type: messageType,
        },
        updatedAt: serverTimestamp(),
        ...unreadUpdates,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  };

  const handleReply = message => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleEditMessage = message => {
    setEditingMessage(message);
    setReplyTo(null); // Clear reply when editing
  };

  const handleSaveEdit = async (messageId, newText, newPlainText) => {
    if (!conversation || !newPlainText.trim()) {
      return;
    }

    try {
      const messageRef = doc(db, `conversations/${conversation.id}/messages`, messageId);

      await updateDoc(messageRef, {
        text: newText,
        plainText: newPlainText.trim(),
        editedAt: serverTimestamp(),
      });

      setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleDeleteMessage = async (messageId, deleteForEveryone) => {
    if (!conversation) {
      return;
    }

    const confirmMessage = deleteForEveryone ? 'Delete this message for everyone?' : 'Delete this message for you?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const messageRef = doc(db, `conversations/${conversation.id}/messages`, messageId);

      if (deleteForEveryone) {
        // Delete for everyone
        await updateDoc(messageRef, {
          deletedAt: serverTimestamp(),
          text: '[Deleted]',
          plainText: '[Deleted]',
        });
      } else {
        // Delete for me only
        await updateDoc(messageRef, {
          deletedFor: [...(messages.find(m => m.id === messageId)?.deletedFor || []), user.uid],
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message: ' + error.message);
    }
  };

  const handleReactToMessage = async (messageId, emoji, action) => {
    if (!conversation) {
      return;
    }

    try {
      const messageRef = doc(db, `conversations/${conversation.id}/messages`, messageId);

      if (action === 'add') {
        // Add reaction
        await updateDoc(messageRef, {
          [`reactions.${user.uid}`]: {
            emoji,
            userName: user.displayName,
            timestamp: serverTimestamp(),
          },
        });
      } else {
        // Remove reaction
        await updateDoc(messageRef, {
          [`reactions.${user.uid}`]: null,
        });
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handlePinMessage = async (messageId, shouldPin) => {
    if (!conversation) {
      return;
    }

    try {
      const messageRef = doc(db, `conversations/${conversation.id}/messages`, messageId);

      if (shouldPin) {
        // Pin the message
        await updateDoc(messageRef, {
          isPinned: true,
          pinnedAt: serverTimestamp(),
          pinnedBy: user.uid,
        });
      } else {
        // Unpin the message
        await updateDoc(messageRef, {
          isPinned: false,
          pinnedAt: null,
          pinnedBy: null,
        });
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      alert('Error pinning message: ' + error.message);
    }
  };

  const handleScrollToMessage = _messageId => {
    // For now, this is a placeholder
    // Future: Implement scrolling to specific message using refs or virtualization API
  };

  const handleForwardMessage = message => {
    setForwardingMessage(message);
    setShowForwardModal(true);
  };

  const handleForwardToConversations = async (message, conversationIds) => {
    if (!message || conversationIds.length === 0) {
      return;
    }

    try {
      // Send the message to each selected conversation
      const promises = conversationIds.map(async conversationId => {
        const messagesRef = collection(db, `conversations/${conversationId}/messages`);

        const forwardedMessage = {
          text: message.text,
          plainText: message.plainText,
          type: 'text',
          senderId: user.uid,
          senderName: user.displayName,
          senderPhotoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          editedAt: null,
          deletedAt: null,
          deletedFor: [],
          replyTo: null,
          attachments: [],
          // Mark as forwarded
          isForwarded: true,
          forwardedFrom: {
            messageId: message.id,
            senderId: message.senderId,
            senderName: message.senderName,
            conversationId: conversation.id,
          },
          // Message status tracking
          status: 'sent',
          readBy: {},
          deliveredTo: {
            [user.uid]: serverTimestamp(),
          },
        };

        await addDoc(messagesRef, forwardedMessage);

        // Update conversation's lastMessage
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          lastMessage: {
            text: `Forwarded: ${message.plainText}`,
            plainText: `Forwarded: ${message.plainText}`,
            senderId: user.uid,
            senderName: user.displayName,
            createdAt: serverTimestamp(),
            type: 'text',
          },
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Error forwarding message: ' + error.message);
    }
  };

  const handleSearch = query => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);

      return;
    }

    // Search through messages
    const results = messages.filter(msg => {
      const searchText = query.toLowerCase();

      return msg.plainText?.toLowerCase().includes(searchText) || msg.senderName?.toLowerCase().includes(searchText);
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };

  const handleNextResult = () => {
    if (currentSearchIndex < searchResults.length - 1) {
      setCurrentSearchIndex(prev => prev + 1);
    }
  };

  const handlePreviousResult = () => {
    if (currentSearchIndex > 0) {
      setCurrentSearchIndex(prev => prev - 1);
    }
  };

  const getConversationName = () => {
    if (!conversation) {
      return '';
    }

    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherUserId = conversation.participants.find(id => id !== user.uid);
    const otherUserData = conversation.participantsData?.[otherUserId];

    return otherUserData?.displayName || 'Unknown User';
  };

  if (!conversation) {
    return (
      <div className='flex items-center justify-center h-full bg-background'>
        <div className='text-center'>
          <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-12 h-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
          </div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>Welcome to Chat</h3>
          <p className='text-gray-500'>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-background'>
      {/* Header */}
      <div className='bg-background-card border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0'>
        <div className='flex items-center space-x-3'>
          <h2 className='text-xl font-semibold text-gray-900'>{getConversationName()}</h2>
          {conversation.type === 'group' ? (
            <span className='text-sm text-gray-500'>{conversation.participants.length} members</span>
          ) : (
            <OnlineStatusIndicator
              userId={conversation.participants.find(id => id !== user.uid)}
              showLastSeen={true}
              size='sm'
            />
          )}
        </div>

        <div className='flex items-center space-x-2'>
          {/* Search Bar */}
          <SearchBar
            onSearch={handleSearch}
            onClear={handleClearSearch}
            resultsCount={searchResults.length}
            currentIndex={currentSearchIndex}
            onNext={handleNextResult}
            onPrevious={handlePreviousResult}
          />

          <button
            onClick={onToggleRightPanel}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            title='Toggle info panel'
          >
            <svg
              className='w-6 h-6 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          onUnpin={handlePinMessage}
          onScrollToMessage={handleScrollToMessage}
        />
      )}

      {/* Messages */}
      <div className='flex-1 overflow-hidden flex flex-col'>
        <div className='flex-1 overflow-auto'>
          {loading ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-gray-500'>Loading messages...</div>
            </div>
          ) : (
            <MessageList
              messages={searchQuery ? searchResults : messages}
              currentUserId={user.uid}
              onReply={handleReply}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReact={handleReactToMessage}
              onPin={handlePinMessage}
              onForward={handleForwardMessage}
              editingMessage={editingMessage}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              searchQuery={searchQuery}
              highlightedMessageId={searchResults[currentSearchIndex]?.id}
            />
          )}
        </div>

        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={forwardingMessage}
        currentUserId={user.uid}
        onForward={handleForwardToConversations}
      />
    </div>
  );
}

ConversationArea.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
  }).isRequired,
  conversation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['direct', 'group']),
    name: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
    participantsData: PropTypes.object,
  }),
  onToggleRightPanel: PropTypes.func.isRequired,
};

export default ConversationArea;
