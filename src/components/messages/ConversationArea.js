import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

function ConversationArea({ user, conversation, onToggleRightPanel }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const messagesRef = collection(db, `conversations/${conversation.id}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      setMessages(messageData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversation]);

  const handleSendMessage = async (messageData) => {
    if (!conversation) return;

    const { plainText, richText, replyTo: replyToMessage } = messageData;

    if (!plainText || !plainText.trim()) return;

    try {
      const messagesRef = collection(db, `conversations/${conversation.id}/messages`);

      const newMessage = {
        text: richText,
        plainText: plainText.trim(),
        type: 'text',
        senderId: user.uid,
        senderName: user.displayName,
        senderPhotoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        editedAt: null,
        deletedAt: null,
        deletedFor: [],
        replyTo: replyToMessage ? {
          messageId: replyToMessage.id,
          text: replyToMessage.text || replyToMessage.plainText,
          plainText: replyToMessage.plainText,
          senderId: replyToMessage.senderId,
          senderName: replyToMessage.senderName
        } : null,
        attachments: []
      };

      await addDoc(messagesRef, newMessage);

      // Update conversation's lastMessage
      const conversationRef = doc(db, 'conversations', conversation.id);
      await updateDoc(conversationRef, {
        lastMessage: {
          text: plainText.trim(),
          plainText: plainText.trim(),
          senderId: user.uid,
          senderName: user.displayName,
          createdAt: serverTimestamp(),
          type: 'text'
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const getConversationName = () => {
    if (!conversation) return '';

    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }

    const otherUserId = conversation.participants.find(id => id !== user.uid);
    const otherUserData = conversation.participantsData?.[otherUserId];
    return otherUserData?.displayName || 'Unknown User';
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-background-card border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {getConversationName()}
          </h2>
          {conversation.type === 'group' && (
            <span className="text-sm text-gray-500">
              {conversation.participants.length} members
            </span>
          )}
        </div>
        <button
          onClick={onToggleRightPanel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Toggle info panel"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={user.uid}
            onReply={handleReply}
          />
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}

export default ConversationArea;
