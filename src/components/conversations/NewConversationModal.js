import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import { db } from '../../firebase/config';

function NewConversationModal({ isOpen, onClose, user, conversations, onConversationCreated }) {
  const [step, setStep] = useState('type'); // 'type' or 'details'
  const [conversationType, setConversationType] = useState('direct'); // 'direct' or 'group'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userList, setUserList] = useState([]);

  const resetModal = () => {
    setStep('type');
    setConversationType('direct');
    setSelectedUsers([]);
    setGroupName('');
    setSearchQuery('');
    setUserList([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Live search effect
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUserList([]);

        return;
      }

      setSearching(true);

      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        const searchLower = searchQuery.trim().toLowerCase();
        const users = [];

        querySnapshot.forEach(doc => {
          const userData = { id: doc.id, ...doc.data() };

          // Filter by email or display name
          const matchesSearch =
            userData.email?.toLowerCase().includes(searchLower) ||
            userData.displayName?.toLowerCase().includes(searchLower);

          // Exclude current user and already selected users
          const isCurrentUser = userData.id === user.uid;
          const isAlreadySelected = selectedUsers.find(u => u.id === userData.id);

          if (matchesSearch && !isCurrentUser && !isAlreadySelected) {
            users.push(userData);
          }
        });

        setUserList(users);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchUsers, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user.uid, selectedUsers]);

  const handleAddUser = userData => {
    // For direct messages, only allow one user
    if (conversationType === 'direct' && selectedUsers.length > 0) {
      return;
    }

    setSelectedUsers([...selectedUsers, userData]);
    setSearchQuery('');
    setUserList([]);
  };

  const handleRemoveUser = userId => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      alert('Please add at least one user.');

      return;
    }

    if (conversationType === 'group' && !groupName.trim()) {
      alert('Please enter a group name.');

      return;
    }

    setCreating(true);

    try {
      // For direct conversation, check if it already exists
      if (conversationType === 'direct' && selectedUsers.length === 1) {
        const otherUserId = selectedUsers[0].id;
        const existingConv = conversations.find(
          conv => conv.type === 'direct' && conv.participants.includes(otherUserId)
        );

        if (existingConv) {
          alert('A conversation with this user already exists.');
          onConversationCreated(existingConv);
          handleClose();

          return;
        }
      }

      // Build participants data
      const participantsData = {
        [user.uid]: {
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          role: conversationType === 'group' ? 'admin' : 'member',
        },
      };

      selectedUsers.forEach(selectedUser => {
        participantsData[selectedUser.id] = {
          displayName: selectedUser.displayName || 'User',
          photoURL: selectedUser.photoURL || '',
          role: 'member',
        };
      });

      const participants = [user.uid, ...selectedUsers.map(u => u.id)];

      // Create new conversation
      const newConversation = {
        type: conversationType,
        name: conversationType === 'group' ? groupName.trim() : null,
        participants,
        participantsData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
      };

      const docRef = await addDoc(collection(db, 'conversations'), newConversation);

      // Create the conversation object with the ID
      const createdConversation = {
        id: docRef.id,
        ...newConversation,
      };

      onConversationCreated(createdConversation);
      handleClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Error creating conversation: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {step === 'type' && 'New Conversation'}
            {step !== 'type' && conversationType === 'group' && 'Create Group'}
            {step !== 'type' && conversationType !== 'group' && 'New Direct Message'}
          </h3>
          <button
            onClick={handleClose}
            className='p-1 hover:bg-gray-100 rounded transition-colors'
          >
            <svg
              className='w-5 h-5 text-gray-500'
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

        {/* Content */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {step === 'type' ? (
            <div className='space-y-3'>
              <p className='text-sm text-gray-600 mb-4'>Choose conversation type:</p>
              <button
                onClick={() => {
                  setConversationType('direct');
                  setStep('details');
                }}
                className='w-full p-4 border-2 border-gray-200 hover:border-primary rounded-lg flex items-center space-x-3 transition-colors'
              >
                <div className='w-12 h-12 bg-primary-light rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
                <div className='flex-1 text-left'>
                  <h4 className='font-semibold text-gray-900'>Direct Message</h4>
                  <p className='text-sm text-gray-500'>Chat with one person</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setConversationType('group');
                  setStep('details');
                }}
                className='w-full p-4 border-2 border-gray-200 hover:border-primary rounded-lg flex items-center space-x-3 transition-colors'
              >
                <div className='w-12 h-12 bg-primary-light rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
                <div className='flex-1 text-left'>
                  <h4 className='font-semibold text-gray-900'>Group Chat</h4>
                  <p className='text-sm text-gray-500'>Chat with multiple people</p>
                </div>
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Group Name (only for groups) */}
              {conversationType === 'group' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Group Name *</label>
                  <input
                    type='text'
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder='Enter group name...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                  />
                </div>
              )}

              {/* Search Users */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Search {conversationType === 'direct' ? 'User' : 'Users'} *
                </label>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Search by name or email...'
                  disabled={conversationType === 'direct' && selectedUsers.length > 0}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
                />
                {searching && searchQuery && <p className='text-xs text-gray-500 mt-1'>Searching...</p>}
              </div>

              {/* User List */}
              {userList.length > 0 && (
                <div className='max-h-60 overflow-y-auto border border-gray-200 rounded-lg'>
                  {userList.map(foundUser => (
                    <div
                      key={foundUser.id}
                      className='p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          {foundUser.photoURL ? (
                            <img
                              src={foundUser.photoURL}
                              alt={foundUser.displayName}
                              className='w-10 h-10 rounded-full'
                            />
                          ) : (
                            <div className='w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold'>
                              {foundUser.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className='font-medium text-gray-900'>{foundUser.displayName || 'User'}</p>
                            <p className='text-sm text-gray-500'>{foundUser.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddUser(foundUser)}
                          disabled={conversationType === 'direct' && selectedUsers.length > 0}
                          className='px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results message */}
              {!searching && searchQuery && userList.length === 0 && (
                <p className='text-sm text-gray-500 text-center py-2'>
                  No users found matching &quot;{searchQuery}&quot;
                </p>
              )}

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Selected ({selectedUsers.length})
                  </label>
                  <div className='space-y-2'>
                    {selectedUsers.map(selectedUser => (
                      <div
                        key={selectedUser.id}
                        className='flex items-center justify-between p-2 bg-primary-light rounded-lg'
                      >
                        <div className='flex items-center space-x-2'>
                          {selectedUser.photoURL ? (
                            <img
                              src={selectedUser.photoURL}
                              alt={selectedUser.displayName}
                              className='w-8 h-8 rounded-full'
                            />
                          ) : (
                            <div className='w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-semibold'>
                              {selectedUser.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className='font-medium text-gray-900'>{selectedUser.displayName || 'User'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(selectedUser.id)}
                          className='p-1 hover:bg-red-100 rounded transition-colors'
                        >
                          <svg
                            className='w-4 h-4 text-red-600'
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
                    ))}
                  </div>
                </div>
              )}

              {conversationType === 'direct' && selectedUsers.length > 0 && (
                <p className='text-xs text-gray-500'>Direct messages can only have one other participant.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
            <button
              onClick={() => setStep('type')}
              className='px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
            >
              Back
            </button>
            <button
              onClick={handleCreateConversation}
              disabled={
                creating ||
                selectedUsers.length === 0 ||
                (conversationType === 'group' && !groupName.trim()) ||
                (conversationType === 'direct' && selectedUsers.length !== 1)
              }
              className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

NewConversationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
  }).isRequired,
  conversations: PropTypes.arrayOf(PropTypes.object).isRequired,
  onConversationCreated: PropTypes.func.isRequired,
};

export default NewConversationModal;
