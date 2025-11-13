import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useState } from 'react';

import { db } from '../../firebase/config';

function NewConversationModal({ isOpen, onClose, user, conversations, onConversationCreated }) {
  const [step, setStep] = useState('type'); // 'type' or 'details'
  const [conversationType, setConversationType] = useState('direct'); // 'direct' or 'group'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const resetModal = () => {
    setStep('type');
    setConversationType('direct');
    setSelectedUsers([]);
    setGroupName('');
    setSearchEmail('');
    setSearchResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('User not found with that email address. They may need to sign in first.');
        setSearching(false);

        return;
      }

      const foundUser = querySnapshot.docs[0];
      const userData = { id: foundUser.id, ...foundUser.data() };

      // Check if user is trying to add themselves
      if (userData.id === user.uid) {
        alert('You cannot add yourself to the conversation.');
        setSearching(false);

        return;
      }

      // Check if user is already selected
      if (selectedUsers.find(u => u.id === userData.id)) {
        alert('This user is already added.');
        setSearching(false);

        return;
      }

      setSearchResult(userData);
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Error searching for user: ' + error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAddUser = () => {
    if (searchResult) {
      setSelectedUsers([...selectedUsers, searchResult]);
      setSearchEmail('');
      setSearchResult(null);
    }
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

              {/* Add Users */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Add {conversationType === 'direct' ? 'User' : 'Users'} (by email) *
                </label>
                <div className='flex space-x-2'>
                  <input
                    type='email'
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchUser()}
                    placeholder='user@example.com'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                  />
                  <button
                    onClick={handleSearchUser}
                    disabled={searching || !searchEmail.trim()}
                    className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Result */}
              {searchResult && (
                <div className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      {searchResult.photoURL ? (
                        <img
                          src={searchResult.photoURL}
                          alt={searchResult.displayName}
                          className='w-10 h-10 rounded-full'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold'>
                          {searchResult.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className='font-medium text-gray-900'>{searchResult.displayName || 'User'}</p>
                        <p className='text-sm text-gray-500'>{searchResult.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddUser}
                      className='px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors'
                    >
                      Add
                    </button>
                  </div>
                </div>
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

export default NewConversationModal;
