// Test Firebase connection and permissions
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../firebase/config';

export const testFirebasePermissions = async user => {
  if (!user) {
    return false;
  }

  try {
    // Test write to users collection
    const userRef = doc(db, 'users', user.uid);

    await setDoc(
      userRef,
      {
        displayName: user.displayName,
        email: user.email,
        testField: 'test',
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );

    // Test read
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return true;
    } else {
      console.warn('⚠️ Document does not exist');

      return false;
    }
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    return false;
  }
};
