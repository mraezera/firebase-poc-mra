import { doc, setDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class PresenceService {
  constructor() {
    this.currentUser = null;
    this.unsubscribePresence = null;
  }

  /**
   * Initialize presence tracking for the current user
   */
  async setUserOnline(user) {
    if (!user) return;

    this.currentUser = user;
    const userStatusRef = doc(db, 'userStatus', user.uid);

    try {
      // Set user as online
      await setDoc(userStatusRef, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || '',
        email: user.email,
        status: 'online',
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Set up automatic offline on disconnect
      this.setupDisconnectHandler(user.uid);

      console.log('✅ User presence set to online');
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  }

  /**
   * Set user as offline
   */
  async setUserOffline(userId) {
    if (!userId) return;

    const userStatusRef = doc(db, 'userStatus', userId);

    try {
      await updateDoc(userStatusRef, {
        status: 'offline',
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ User presence set to offline');
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  /**
   * Set up event listeners to detect when user goes offline
   */
  setupDisconnectHandler(userId) {
    // Update last seen periodically while user is active
    const updateInterval = setInterval(async () => {
      if (this.currentUser) {
        const userStatusRef = doc(db, 'userStatus', userId);
        try {
          await updateDoc(userStatusRef, {
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating last seen:', error);
        }
      }
    }, 30000); // Update every 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await this.setUserOffline(userId);
      } else {
        await this.setUserOnline(this.currentUser);
      }
    };

    // Handle page unload/close
    const handleBeforeUnload = async () => {
      await this.setUserOffline(userId);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Store cleanup function
    this.cleanup = () => {
      clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }

  /**
   * Subscribe to another user's presence
   */
  subscribeToUserPresence(userId, callback) {
    const userStatusRef = doc(db, 'userStatus', userId);

    return onSnapshot(userStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback({ status: 'offline' });
      }
    }, (error) => {
      console.error('Error subscribing to user presence:', error);
    });
  }

  /**
   * Update typing status for a conversation
   */
  async setTypingStatus(conversationId, isTyping) {
    if (!this.currentUser) return;

    const conversationRef = doc(db, 'conversations', conversationId);

    try {
      if (isTyping) {
        // Add user to typing map
        await updateDoc(conversationRef, {
          [`typing.${this.currentUser.uid}`]: {
            userId: this.currentUser.uid,
            displayName: this.currentUser.displayName,
            timestamp: serverTimestamp()
          }
        });
      } else {
        // Remove user from typing map
        await updateDoc(conversationRef, {
          [`typing.${this.currentUser.uid}`]: null
        });
      }
    } catch (error) {
      // Conversation might not exist yet, ignore error
      if (error.code !== 'not-found') {
        console.error('Error updating typing status:', error);
      }
    }
  }

  /**
   * Subscribe to typing indicators for a conversation
   */
  subscribeToTypingIndicators(conversationId, currentUserId, callback) {
    const conversationRef = doc(db, 'conversations', conversationId);

    return onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const typingUsers = [];

        if (data.typing) {
          const now = Date.now();

          Object.entries(data.typing).forEach(([userId, typingData]) => {
            // Skip null entries and current user
            if (!typingData || userId === currentUserId) return;

            // Check if timestamp is recent (within last 5 seconds)
            const typingTime = typingData.timestamp?.toMillis?.() || 0;
            if (now - typingTime < 5000) {
              typingUsers.push(typingData);
            }
          });
        }

        callback(typingUsers);
      } else {
        callback([]);
      }
    });
  }

  /**
   * Clean up presence tracking
   */
  async cleanup() {
    if (this.currentUser) {
      await this.setUserOffline(this.currentUser.uid);
    }

    if (this.cleanup) {
      this.cleanup();
    }

    if (this.unsubscribePresence) {
      this.unsubscribePresence();
    }
  }
}

// Export singleton instance
export const presenceService = new PresenceService();
