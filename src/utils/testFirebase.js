// Test Firebase connection and permissions
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const testFirebasePermissions = async (user) => {
  if (!user) {
    console.log('❌ No user logged in');
    return false;
  }

  console.log('🔍 Testing Firebase permissions...');
  console.log('User:', user.uid, user.email);

  try {
    // Test write to users collection
    const userRef = doc(db, 'users', user.uid);
    console.log('📝 Attempting to write user document...');

    await setDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
      testField: 'test',
      timestamp: new Date().toISOString()
    }, { merge: true });

    console.log('✅ Write successful!');

    // Test read
    console.log('📖 Attempting to read user document...');
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      console.log('✅ Read successful!');
      console.log('Data:', docSnap.data());
      return true;
    } else {
      console.log('⚠️ Document does not exist');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
};
