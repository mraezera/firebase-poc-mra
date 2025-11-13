import clsx from 'clsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import { db } from '../../firebase/config';

/**
 * Modal for forwarding a message to other conversations
 */
function ForwardMessageModal({ isOpen, onClose, message, currentUserId, onForward }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !currentUserId) {
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, where('participants', 'array-contains', currentUserId));

        const snapshot = await getDocs(q);
        const convos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setConversations(convos);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isOpen, currentUserId]);

  const handleToggleConversation = conversationId => {
    setSelectedConversations(prev => {
      if (prev.includes(conversationId)) {
        return prev.filter(id => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  const handleForward = () => {
    if (selectedConversations.length > 0 && onForward) {
      onForward(message, selectedConversations);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedConversations([]);
    onClose();
  };

  const getConversationName = conversation => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    const otherUserData = conversation.participantsData?.[otherUserId];

    return otherUserData?.displayName || 'Unknown User';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900'>Forward Message</h3>
          <button
            onClick={handleClose}
            className='p-1 hover:bg-gray-100 rounded transition-colors'
          >
            <svg
              className='w-5 h-5 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Message Preview */}
        <div className='px-6 py-3 bg-gray-50 border-b border-gray-200'>
          <p className='text-xs text-gray-600 mb-1'>Forwarding:</p>
          <p className='text-sm text-gray-800 truncate'>{message?.plainText || 'Message'}</p>
        </div>

        {/* Conversation List */}
        <div className='px-6 py-4 max-h-96 overflow-y-auto'>
          {loading && (
            <div className='flex items-center justify-center py-8'>
              <div className='text-gray-500'>Loading conversations...</div>
            </div>
          )}
          {!loading && conversations.length === 0 && (
            <div className='flex items-center justify-center py-8'>
              <div className='text-gray-500'>No conversations available</div>
            </div>
          )}
          {!loading && conversations.length > 0 && (
            <div className='space-y-2'>
              {conversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => handleToggleConversation(conversation.id)}
                  className={clsx(
                    'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left',
                    selectedConversations.includes(conversation.id)
                      ? 'bg-primary-light border-2 border-primary'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={clsx(
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                      selectedConversations.includes(conversation.id) ? 'bg-primary border-primary' : 'border-gray-300'
                    )}
                  >
                    {selectedConversations.includes(conversation.id) && (
                      <svg
                        className='w-3 h-3 text-white'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>{getConversationName(conversation)}</p>
                    {conversation.type === 'group' && (
                      <p className='text-xs text-gray-500'>{conversation.participants.length} members</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200'>
          <button
            onClick={handleClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedConversations.length === 0}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded transition-colors',
              selectedConversations.length > 0
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Forward {selectedConversations.length > 0 && `(${selectedConversations.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

ForwardMessageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.object,
  currentUserId: PropTypes.string.isRequired,
  onForward: PropTypes.func.isRequired,
};

export default ForwardMessageModal;
