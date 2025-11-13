import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';

import LoginForm from './components/auth/LoginForm';
import Layout from './components/layout/Layout';
import SettingsModal from './components/settings/SettingsModal';
import { auth } from './firebase/config';
import { presenceService } from './services/presenceService';
import { cleanupDatabase } from './utils/cleanupDatabase';
import { testFirebasePermissions } from './utils/testFirebase';

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [cleanupDone, setCleanupDone] = useState(localStorage.getItem('firestoreCleanupDone') === 'true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        // Run cleanup once if not done yet
        if (!cleanupDone) {
          const result = await cleanupDatabase();
          if (result.success) {
            localStorage.setItem('firestoreCleanupDone', 'true');
            setCleanupDone(true);
            alert(
              `Database cleanup complete!\n\nCleaned ${result.cleanedCount} items.\n\nThe page will now reload to clear the cache.`
            );
            window.location.reload();

            return;
          }
        }

        setUser(user);

        // Test Firebase permissions
        const hasPermissions = await testFirebasePermissions(user);

        if (!hasPermissions) {
          console.error('⚠️ FIREBASE PERMISSIONS ERROR');
          console.error('Please update Firestore security rules in Firebase Console:');
          console.error('1. Go to https://console.firebase.google.com');
          console.error('2. Select your project: poc-app-d8509');
          console.error('3. Click Firestore Database > Rules');
          console.error('4. Use the simple test rules (allow read, write: if request.auth != null)');
          console.error('5. Click Publish');
          console.error('6. Sign out and sign back in');

          alert(
            '⚠️ Firebase permissions error!\n\nPlease check the browser console (F12) for instructions on how to fix this.\n\nYou need to update Firestore security rules in the Firebase Console.'
          );
        }

        // Set user online status
        await presenceService.setUserOnline(user);
      } else {
        setUser(null);
        // Clean up presence when user logs out
        await presenceService.cleanup();
      }

      if (initializing) {
        setInitializing(false);
      }
    });

    return () => {
      unsubscribe();
      // Clean up presence on unmount
      presenceService.cleanup();
    };
  }, [initializing, cleanupDone]);

  const signOut = async () => {
    try {
      // Set user offline before signing out
      if (user) {
        await presenceService.setUserOffline(user.uid);
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error(error.message);
    }
  };

  if (initializing) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-gray-700 text-2xl font-semibold'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen bg-background'>
      {user ? (
        <>
          {/* Header */}
          <header className='bg-background-card shadow-sm border-b border-gray-200 flex-shrink-0'>
            <div className='px-6 py-3 flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                  </svg>
                </div>
                <h1 className='text-xl font-bold text-gray-900'>Piche Chat</h1>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='flex items-center space-x-2'>
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className='w-8 h-8 rounded-full'
                    />
                  )}
                  <span className='text-gray-700 font-medium whitespace-nowrap'>{user.displayName}</span>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                  title='Settings'
                >
                  <svg
                    className='w-6 h-6 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                </button>
                <button
                  onClick={signOut}
                  className='px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 whitespace-nowrap'
                >
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          {/* Main Layout */}
          <div className='flex-1 overflow-hidden'>
            <Layout user={user} />
          </div>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            user={user}
          />
        </>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

export default App;
