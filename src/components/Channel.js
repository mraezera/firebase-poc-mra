import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import Message from './Message';

const Channel = ({ user = null, db = null }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (db) {
      const q = query(collection(db, 'messages'), orderBy('createdAt'), limit(100));

      const unsubscribe = onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setMessages(data);
      });

      return unsubscribe;
    }
  }, [db]);

  const handleOnChange = e => {
    setNewMessage(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (db) {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      setNewMessage('');
    }
  };

  const handleDeleteMessage = async messageId => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'messages', messageId));
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  return (
    <div className='flex flex-col flex-1 max-w-7xl w-full mx-auto my-4'>
      <div className='flex-1 overflow-y-auto bg-white rounded-t-lg shadow-lg p-4 space-y-2'>
        {messages.length === 0 ? (
          <div className='flex items-center justify-center h-full text-gray-400'>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <Message
              key={message.id}
              {...message}
              currentUser={user}
              onDelete={handleDeleteMessage}
            />
          ))
        )}
      </div>
      <div className='bg-white rounded-b-lg shadow-lg border-t border-gray-200 p-4'>
        <form
          onSubmit={handleSubmit}
          className='flex space-x-4'
        >
          <input
            type='text'
            value={newMessage}
            onChange={handleOnChange}
            placeholder='Type a message...'
            aria-label='Type a message'
            className='flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036100] focus:border-transparent'
          />
          <button
            type='submit'
            className='bg-[#036100] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#034A00] transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

Channel.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
  }),
  db: PropTypes.object,
};

export default Channel;
