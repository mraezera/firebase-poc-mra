import { formatRelative } from 'date-fns';
import PropTypes from 'prop-types';
import React from 'react';

const Message = ({
  id = '',
  createdAt = null,
  text = '',
  displayName = '',
  photoURL = '',
  uid = '',
  currentUser = null,
  onDelete = null,
}) => {
  const isOwnMessage = currentUser && uid === currentUser.uid;

  const handleDelete = () => {
    if (onDelete && id) {
      onDelete(id);
    }
  };

  return (
    <div className='group flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 relative'>
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName}
          className='w-10 h-10 rounded-full ring-2 ring-[#036100] ring-offset-2'
        />
      ) : (
        <div className='w-10 h-10 rounded-full bg-[#036100] flex items-center justify-center text-white font-semibold'>
          {displayName ? displayName.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      <div className='flex-1 min-w-0'>
        <div className='flex items-baseline space-x-2'>
          {displayName && <p className='font-semibold text-gray-900'>{displayName}</p>}
          {createdAt?.seconds && (
            <span className='text-xs text-gray-500'>
              {formatRelative(new Date(createdAt.seconds * 1000), new Date())}
            </span>
          )}
        </div>
        <p className='text-gray-800 mt-1 break-words'>{text}</p>
      </div>
      {isOwnMessage && (
        <button
          onClick={handleDelete}
          className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50'
          title='Delete message'
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
              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
            />
          </svg>
        </button>
      )}
    </div>
  );
};

Message.propTypes = {
  id: PropTypes.string,
  createdAt: PropTypes.object,
  text: PropTypes.string,
  displayName: PropTypes.string,
  photoURL: PropTypes.string,
  uid: PropTypes.string,
  currentUser: PropTypes.shape({
    uid: PropTypes.string,
  }),
  onDelete: PropTypes.func,
};

export default Message;
