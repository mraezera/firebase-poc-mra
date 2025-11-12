import React, { useState } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

function ConversationDetails({ conversation, currentUser, onClose }) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  if (!conversation) return null;

  const isGroupChat = conversation.type === 'group';
  const currentUserRole = conversation.participantsData?.[currentUser.uid]?.role;
  const isAdmin = currentUserRole === 'admin';
  const members = Object.entries(conversation.participantsData || {}).map(([uid, data]) => ({
    uid,
    ...data
  }));

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;

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

      // Check if user is already in conversation
      if (conversation.participants.includes(userData.id)) {
        alert('This user is already in the conversation.');
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

  const handleAddMember = async () => {
    if (!searchResult || !isAdmin) return;

    try {
      const conversationRef = doc(db, 'conversations', conversation.id);

      // Add to participants array and participantsData
      await updateDoc(conversationRef, {
        participants: arrayUnion(searchResult.id),
        [`participantsData.${searchResult.id}`]: {
          displayName: searchResult.displayName || 'User',
          photoURL: searchResult.photoURL || '',
          role: 'member'
        },
        updatedAt: serverTimestamp()
      });

      setSearchEmail('');
      setSearchResult(null);
      setIsAddingMember(false);
      alert(`${searchResult.displayName || 'User'} has been added to the group.`);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Error adding member: ' + error.message);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!isAdmin) return;

    if (memberId === currentUser.uid) {
      alert('You cannot remove yourself from the group. Use "Leave Group" instead.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      return;
    }

    try {
      const conversationRef = doc(db, 'conversations', conversation.id);

      // Remove from participants array and participantsData
      await updateDoc(conversationRef, {
        participants: arrayRemove(memberId),
        [`participantsData.${memberId}`]: null,
        updatedAt: serverTimestamp()
      });

      alert(`${memberName} has been removed from the group.`);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member: ' + error.message);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      const conversationRef = doc(db, 'conversations', conversation.id);

      await updateDoc(conversationRef, {
        participants: arrayRemove(currentUser.uid),
        [`participantsData.${currentUser.uid}`]: null,
        updatedAt: serverTimestamp()
      });

      onClose();
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Error leaving group: ' + error.message);
    }
  };

  const handleTogglePin = async () => {
    try {
      const conversationRef = doc(db, 'conversations', conversation.id);
      const isPinned = conversation.userPreferences?.[currentUser.uid]?.pinned || false;

      await updateDoc(conversationRef, {
        [`userPreferences.${currentUser.uid}.pinned`]: !isPinned,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Error updating conversation: ' + error.message);
    }
  };

  const handleToggleMute = async () => {
    try {
      const conversationRef = doc(db, 'conversations', conversation.id);
      const isMuted = conversation.userPreferences?.[currentUser.uid]?.muted || false;

      await updateDoc(conversationRef, {
        [`userPreferences.${currentUser.uid}.muted`]: !isMuted,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling mute:', error);
      alert('Error updating conversation: ' + error.message);
    }
  };

  const handleToggleArchive = async () => {
    try {
      const conversationRef = doc(db, 'conversations', conversation.id);
      const isArchived = conversation.userPreferences?.[currentUser.uid]?.archived || false;

      await updateDoc(conversationRef, {
        [`userPreferences.${currentUser.uid}.archived`]: !isArchived,
        updatedAt: serverTimestamp()
      });

      if (!isArchived) {
        onClose(); // Close panel when archiving
      }
    } catch (error) {
      console.error('Error toggling archive:', error);
      alert('Error updating conversation: ' + error.message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {isGroupChat ? 'Group Details' : 'Conversation Details'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Group Info */}
        {isGroupChat && (
          <div className="text-center pb-6 border-b border-gray-200">
            <div className="w-20 h-20 mx-auto mb-3 bg-primary-light rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {conversation.name || 'Group Chat'}
            </h3>
            <p className="text-sm text-gray-500">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        )}

        {/* Members List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase">
              {isGroupChat ? 'Members' : 'Participants'}
            </h4>
            {isGroupChat && isAdmin && (
              <button
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                {isAddingMember ? 'Cancel' : '+ Add Member'}
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {isAddingMember && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  placeholder="user@example.com"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleSearchUser}
                  disabled={searching || !searchEmail.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Result */}
              {searchResult && (
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {searchResult.photoURL ? (
                        <img src={searchResult.photoURL} alt={searchResult.displayName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                          {searchResult.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{searchResult.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500">{searchResult.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddMember}
                      className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.uid}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                      {member.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {member.displayName || 'User'}
                        {member.uid === currentUser.uid && (
                          <span className="text-gray-500 text-sm ml-1">(You)</span>
                        )}
                      </p>
                      {member.role === 'admin' && (
                        <span className="px-2 py-0.5 bg-primary-light text-primary text-xs font-medium rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Member Button (only for admins, not for self) */}
                {isGroupChat && isAdmin && member.uid !== currentUser.uid && (
                  <button
                    onClick={() => handleRemoveMember(member.uid, member.displayName)}
                    className="p-1.5 hover:bg-red-100 rounded transition-colors"
                    title="Remove member"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conversation Actions */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">
            Actions
          </h4>
          <div className="space-y-2">
            <button
              onClick={handleTogglePin}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-600" fill={conversation.userPreferences?.[currentUser.uid]?.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="font-medium text-gray-900">
                  {conversation.userPreferences?.[currentUser.uid]?.pinned ? 'Unpin' : 'Pin'} Conversation
                </span>
              </div>
            </button>

            <button
              onClick={handleToggleMute}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                {conversation.userPreferences?.[currentUser.uid]?.muted ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
                <span className="font-medium text-gray-900">
                  {conversation.userPreferences?.[currentUser.uid]?.muted ? 'Unmute' : 'Mute'} Notifications
                </span>
              </div>
            </button>

            <button
              onClick={handleToggleArchive}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="font-medium text-gray-900">
                  {conversation.userPreferences?.[currentUser.uid]?.archived ? 'Unarchive' : 'Archive'} Conversation
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Leave Group Button */}
        {isGroupChat && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleLeaveGroup}
              className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationDetails;
