import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import Button from "./components/Button";
import Layout from "./components/layout/Layout";
import { testFirebasePermissions } from './utils/testFirebase';

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Test Firebase permissions
        console.log('🔐 Testing Firebase permissions...');
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

          alert('⚠️ Firebase permissions error!\n\nPlease check the browser console (F12) for instructions on how to fix this.\n\nYou need to update Firestore security rules in the Firebase Console.');
        } else {
          console.log('✅ Firebase permissions OK!');
        }
      } else {
        setUser(null);
      }

      if (initializing) {
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, [initializing]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error(error.message);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-gray-700 text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {user ? (
        <>
          {/* Header */}
          <header className="bg-background-card shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Piche Chat</h1>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                  )}
                  <span className="text-gray-700 font-medium whitespace-nowrap">
                    {user.displayName}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 whitespace-nowrap"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          {/* Main Layout */}
          <div className="flex-1 overflow-hidden">
            <Layout user={user} />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-background-card rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Piche Chat</h1>
              <p className="text-gray-600">Connect with your team and chat in real-time</p>
            </div>
            <Button onClick={signInWithGoogle}>Sign in with Google</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
