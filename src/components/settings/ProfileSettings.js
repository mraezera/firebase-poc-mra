import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { db, storage } from '../../firebase/config';

/**
 * Profile settings tab
 */
function ProfileSettings({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [status, setStatus] = useState('Available');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handlePhotoSelect = e => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setMessage('Display name is required');

      return;
    }

    try {
      setSaving(true);
      setMessage('');

      let photoURL = user.photoURL;

      // Upload photo if changed
      if (photoFile) {
        const storageRef = ref(storage, `profile-photos/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL,
      });

      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        photoURL: photoURL,
        status: status,
        updatedAt: new Date(),
      });

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = name => {
    if (!name) {
      return '?';
    }

    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Profile Information</h3>
        <p className='text-sm text-gray-600 mb-6'>Update your personal information and profile photo</p>
      </div>

      {/* Profile Photo */}
      <div className='flex items-center space-x-6'>
        <div className='relative'>
          {photoPreview ? (
            <img
              src={photoPreview}
              alt='Profile'
              className='w-24 h-24 rounded-full object-cover border-4 border-gray-200'
            />
          ) : (
            <div className='w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center text-white text-2xl font-semibold border-4 border-gray-200'>
              {getInitials(displayName)}
            </div>
          )}
          <button
            onClick={() => document.getElementById('photo-upload').click()}
            className='absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition-colors shadow-lg'
            title='Change photo'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
          </button>
          <input
            id='photo-upload'
            type='file'
            accept='image/*'
            onChange={handlePhotoSelect}
            className='hidden'
            aria-label='Upload profile photo'
          />
        </div>
        <div>
          <h4 className='font-medium text-gray-900'>Profile Photo</h4>
          <p className='text-sm text-gray-600'>Click the camera icon to upload a new photo</p>
          <p className='text-xs text-gray-500 mt-1'>JPG, PNG or GIF. Max size 5MB</p>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor='display-name' className='block text-sm font-medium text-gray-700 mb-2'>Display Name</label>
        <input
          id='display-name'
          type='text'
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder='Enter your name'
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>Email</label>
        <input
          id='email'
          type='email'
          value={user.email}
          disabled
          className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed'
        />
        <p className='text-xs text-gray-500 mt-1'>Email cannot be changed</p>
      </div>

      {/* Status */}
      <div>
        <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
        <select
          id='status'
          value={status}
          onChange={e => setStatus(e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
        >
          <option value='Available'>Available</option>
          <option value='Busy'>Busy</option>
          <option value='Away'>Away</option>
          <option value='Do not disturb'>Do not disturb</option>
        </select>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {message}
        </div>
      )}

      {/* Save Button */}
      <div className='flex justify-end pt-4 border-t border-gray-200'>
        <button
          onClick={handleSave}
          disabled={saving}
          className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

ProfileSettings.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
};

export default ProfileSettings;
