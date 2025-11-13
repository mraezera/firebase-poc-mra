import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import React, { useState } from 'react';

import { auth } from '../../firebase/config';
import Button from '../Button';

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setError('');
    setLoading(true);

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordAuth = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        if (!displayName.trim()) {
          setError('Please enter your display name');
          setLoading(false);

          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update user profile with display name
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('Email/Password auth error:', error);

      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please sign in instead.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email. Please sign up.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='bg-background-card rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 border border-gray-200'>
        <div className='text-center mb-8'>
          <div className='w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-12 h-12 text-white'
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
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Welcome to Piche Chat</h1>
          <p className='text-gray-600'>
            {isSignUp ? 'Create an account to get started' : 'Sign in to continue chatting'}
          </p>
        </div>

        {/* Email/Password Form */}
        <form
          onSubmit={handleEmailPasswordAuth}
          className='space-y-4 mb-4'
        >
          {isSignUp && (
            <div>
              <label
                htmlFor='displayName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Display Name
              </label>
              <input
                id='displayName'
                type='text'
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder='Enter your name'
                required={isSignUp}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
              />
            </div>
          )}

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='your@email.com'
              required
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter your password'
              required
              minLength={6}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            />
            {isSignUp && <p className='text-xs text-gray-500 mt-1'>Minimum 6 characters</p>}
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>{error}</div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-primary text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading && 'Please wait...'}
            {!loading && isSignUp && 'Sign Up'}
            {!loading && !isSignUp && 'Sign In'}
          </button>
        </form>

        {/* Toggle Sign Up/Sign In */}
        <div className='text-center mb-4'>
          <button
            onClick={toggleMode}
            className='text-primary hover:text-primary-dark font-medium text-sm'
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Divider */}
        <div className='relative my-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-background-card text-gray-500'>Or continue with</span>
          </div>
        </div>

        {/* Google Sign In */}
        <Button
          onClick={signInWithGoogle}
          disabled={loading}
        >
          <div className='flex items-center justify-center space-x-2'>
            <svg
              className='w-5 h-5'
              viewBox='0 0 24 24'
            >
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            <span>Sign in with Google</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

LoginForm.propTypes = {};

export default LoginForm;
