# Firebase Schema Design

## Firestore Collections

### 1. users
```
users/{userId}
  - displayName: string
  - photoURL: string
  - email: string
  - status: 'online' | 'offline' | 'away'
  - lastSeen: timestamp
  - createdAt: timestamp
```

### 2. conversations
```
conversations/{conversationId}
  - type: 'direct' | 'group'
  - name: string (for groups)
  - photoURL: string (for groups)
  - participants: array<userId>
  - participantsData: map {
      userId: {
        displayName: string,
        photoURL: string,
        role: 'admin' | 'member' (for groups)
      }
    }
  - createdBy: userId
  - createdAt: timestamp
  - updatedAt: timestamp
  - lastMessage: {
      text: string,
      senderId: userId,
      senderName: string,
      createdAt: timestamp,
      type: 'text' | 'deleted'
    }
```

### 3. messages (subcollection of conversations)
```
conversations/{conversationId}/messages/{messageId}
  - text: string (Slate JSON for rich text)
  - plainText: string (for search/preview)
  - type: 'text' | 'voice' | 'file'
  - senderId: userId
  - senderName: string
  - senderPhotoURL: string
  - createdAt: timestamp
  - editedAt: timestamp | null
  - deletedAt: timestamp | null
  - deletedFor: array<userId> (for "delete for me")
  - replyTo: {
      messageId: string,
      text: string,
      senderId: userId,
      senderName: string
    } | null
  - attachments: array<{
      name: string,
      url: string,
      type: string,
      size: number
    }>
```

### 4. reactions (subcollection of messages)
```
conversations/{conversationId}/messages/{messageId}/reactions/{userId}
  - emoji: string
  - createdAt: timestamp
```

### 5. conversationMeta
```
conversationMeta/{userId}_{conversationId}
  - userId: userId
  - conversationId: conversationId
  - isPinned: boolean
  - isMuted: boolean
  - isHidden: boolean
  - lastReadMessageId: string | null
  - lastReadAt: timestamp | null
  - unreadCount: number
  - draft: string (Slate JSON) | null
  - updatedAt: timestamp
```

### 6. pinnedMessages
```
pinnedMessages/{userId}_{conversationId}_{messageId}
  - userId: userId
  - conversationId: conversationId
  - messageId: messageId
  - pinnedAt: timestamp
  - pinnedBy: userId
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Conversations - only participants can access
    match /conversations/{conversationId} {
      allow read: if request.auth != null &&
                     request.auth.uid in resource.data.participants;
      allow create: if request.auth != null &&
                       request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null &&
                       request.auth.uid in resource.data.participants;

      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null &&
                       request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth != null &&
                         request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants &&
                         request.auth.uid == request.resource.data.senderId;
        allow update, delete: if request.auth != null &&
                                 (request.auth.uid == resource.data.senderId ||
                                  request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants);

        // Reactions subcollection
        match /reactions/{userId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }

    // Conversation metadata - user can only access their own
    match /conversationMeta/{metaId} {
      allow read, write: if request.auth != null &&
                            metaId.split('_')[0] == request.auth.uid;
    }

    // Pinned messages - user can only access their own
    match /pinnedMessages/{pinId} {
      allow read, write: if request.auth != null &&
                            pinId.split('_')[0] == request.auth.uid;
    }
  }
}
```

## Firebase Storage Structure

```
/voices/{conversationId}/{messageId}.webm
/files/{conversationId}/{messageId}/{filename}
/avatars/{userId}/{filename}
```

## Indexes Required

```
Collection: conversations
Fields: participants (Array), updatedAt (Descending)

Collection: messages (subcollection)
Fields: createdAt (Ascending)
Fields: createdAt (Descending)

Collection: conversationMeta
Fields: userId (Ascending), isPinned (Descending), updatedAt (Descending)
Fields: userId (Ascending), unreadCount (Descending)
```

## Usage Patterns

### Get user's conversations
```javascript
const q = query(
  collection(db, 'conversations'),
  where('participants', 'array-contains', userId),
  orderBy('updatedAt', 'desc'),
  limit(50)
);
```

### Get messages for a conversation
```javascript
const q = query(
  collection(db, `conversations/${conversationId}/messages`),
  orderBy('createdAt', 'desc'),
  limit(100)
);
```

### Get conversation metadata
```javascript
const metaDoc = doc(db, 'conversationMeta', `${userId}_${conversationId}`);
```

### Update unread count
```javascript
// Increment on new message
increment(1)

// Reset to 0 when user reads
updateDoc(metaRef, { unreadCount: 0, lastReadAt: serverTimestamp() });
```
