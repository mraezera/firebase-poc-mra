import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

import { db } from '../firebase/config';

/**
 * One-time cleanup utility to remove large photoURL data from Firestore
 * This fixes the INTERNAL ASSERTION FAILED error
 */
export async function cleanupDatabase() {
  try {
    // Clean up users collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let cleanedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();

      // Check if photoURL exists and is a base64 string (starts with data:)
      if (data.photoURL && data.photoURL.startsWith('data:')) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          photoURL: '',
        });
        cleanedCount++;
      }
    }

    // Clean up conversations - remove any large lastMessage data
    const conversationsRef = collection(db, 'conversations');
    const convsSnapshot = await getDocs(conversationsRef);

    for (const convDoc of convsSnapshot.docs) {
      const messagesRef = collection(db, `conversations/${convDoc.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);

      for (const msgDoc of messagesSnapshot.docs) {
        const msgData = msgDoc.data();

        // Remove attachments if they exist
        if (msgData.attachments && msgData.attachments.length > 0) {
          await updateDoc(doc(db, `conversations/${convDoc.id}/messages`, msgDoc.id), {
            attachments: [],
          });
          cleanedCount++;
        }
      }
    }

    return { success: true, cleanedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
