import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

import { db } from '../../firebase/config';
import ConversationCard from './ConversationCard';
import NewConversationModal from './NewConversationModal';

function ConversationList({ user, selectedConversation, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Simple query without orderBy to avoid index requirement
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const conversationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort in memory instead
        conversationData.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;

          return bTime - aTime;
        });

        setConversations(conversationData);
        setLoading(false);
      },
      error => {
        console.error('Error fetching conversations:', error);
        alert('Error loading conversations. Check console for details.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleConversationCreated = conversation => {
    onSelectConversation(conversation);
  };

  const getConversationName = (conversation, currentUserId) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    const otherUserData = conversation.participantsData?.[otherUserId];

    return otherUserData?.displayName || 'Unknown User';
  };

  const filteredConversations = conversations
    .filter(conv => {
      // Filter by archive status
      const isArchived = conv.userPreferences?.[user.uid]?.archived || false;
      if (showArchived) {
        return isArchived;
      } else {
        if (isArchived) {
          return false;
        }
      }

      // Filter by search query
      if (!searchQuery) {
        return true;
      }
      const name = conv.name || getConversationName(conv, user.uid);

      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort by pinned status first
      const aPinned = a.userPreferences?.[user.uid]?.pinned || false;
      const bPinned = b.userPreferences?.[user.uid]?.pinned || false;

      if (aPinned && !bPinned) {
        return -1;
      }
      if (!aPinned && bPinned) {
        return 1;
      }

      // Then sort by updatedAt (already sorted from Firebase, but maintain order)
      const aTime = a.updatedAt?.toMillis() || 0;
      const bTime = b.updatedAt?.toMillis() || 0;

      return bTime - aTime;
    });

  const archivedCount = conversations.filter(conv => conv.userPreferences?.[user.uid]?.archived).length;

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <h2 className='text-xl font-bold text-gray-900'>{showArchived ? 'Archived' : 'Messages'}</h2>
            {archivedCount > 0 && !showArchived && (
              <button
                onClick={() => setShowArchived(true)}
                className='px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors'
                title='View archived conversations'
              >
                {archivedCount} archived
              </button>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            {showArchived && (
              <button
                onClick={() => setShowArchived(false)}
                className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                title='Back to messages'
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
                    d='M10 19l-7-7m0 0l7-7m-7 7h18'
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className='w-8 h-8 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center transition-colors'
              title='New conversation'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className='relative'>
          <input
            type='text'
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
          />
          <svg
            className='w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
      </div>

      {/* Conversation List */}
      <div className='flex-1 overflow-y-auto'>
        {loading && (
          <div className='flex items-center justify-center h-32'>
            <div className='text-gray-500'>Loading conversations...</div>
          </div>
        )}
        {!loading && filteredConversations.length === 0 && (
          <div className='flex flex-col items-center justify-center h-32 text-gray-500'>
            <p>No conversations yet</p>
            <p className='text-sm mt-1'>Click + to start a new chat</p>
          </div>
        )}
        {!loading && filteredConversations.length > 0 && (
          <div className='py-2'>
            {filteredConversations.map(conversation => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                currentUserId={user.uid}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => onSelectConversation(conversation)}
                unreadCount={conversation.unreadCount?.[user.uid] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        conversations={conversations}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}

export default ConversationList;
