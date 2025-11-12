import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConversationCard from './ConversationCard';

function ConversationList({ user, selectedConversation, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Simple query without orderBy to avoid index requirement
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort in memory instead
      conversationData.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });

      setConversations(conversationData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      alert('Error loading conversations. Check console for details.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewConversation = async () => {
    const email = prompt('Enter email address to chat with:');
    if (!email || !email.trim()) return;

    setCreating(true);

    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('User not found with that email address. They may need to sign in first.');
        setCreating(false);
        return;
      }

      const otherUser = querySnapshot.docs[0];
      const otherUserData = otherUser.data();
      const otherUserId = otherUser.id;

      // Check if user is trying to chat with themselves
      if (otherUserId === user.uid) {
        alert('You cannot create a conversation with yourself.');
        setCreating(false);
        return;
      }

      // Check if conversation already exists
      const existingConv = conversations.find(conv =>
        conv.type === 'direct' &&
        conv.participants.includes(otherUserId)
      );

      if (existingConv) {
        alert('A conversation with this user already exists.');
        onSelectConversation(existingConv);
        setCreating(false);
        return;
      }

      // Create new conversation
      const newConversation = {
        type: 'direct',
        participants: [user.uid, otherUserId],
        participantsData: {
          [user.uid]: {
            displayName: user.displayName,
            photoURL: user.photoURL || '',
            role: 'member'
          },
          [otherUserId]: {
            displayName: otherUserData.displayName || 'User',
            photoURL: otherUserData.photoURL || '',
            role: 'member'
          }
        },
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null
      };

      await addDoc(collection(db, 'conversations'), newConversation);
      alert('Conversation created successfully!');
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Error creating conversation: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.name || getConversationName(conv, user.uid);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationName = (conversation, currentUserId) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    const otherUserData = conversation.participantsData?.[otherUserId];
    return otherUserData?.displayName || 'Unknown User';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <button
            onClick={createNewConversation}
            disabled={creating}
            className="w-8 h-8 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="New conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Click + to start a new chat</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                currentUserId={user.uid}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversationList;
