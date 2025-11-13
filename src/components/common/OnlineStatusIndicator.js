import { formatDistanceToNow } from 'date-fns';
import React, { useEffect, useState } from 'react';

import { presenceService } from '../../services/presenceService';

/**
 * Shows online/offline status indicator
 * Can be used as a dot overlay on avatars or standalone
 */
function OnlineStatusIndicator({ userId, showLastSeen = false, size = 'md' }) {
  const [userStatus, setUserStatus] = useState({ status: 'offline' });

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Subscribe to user's presence
    const unsubscribe = presenceService.subscribeToUserPresence(userId, status => {
      setUserStatus(status);
    });

    return () => unsubscribe();
  }, [userId]);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColor = userStatus.status === 'online' ? 'bg-green-500' : 'bg-gray-400';

  if (showLastSeen && userStatus.status === 'offline' && userStatus.lastSeen) {
    const lastSeenText = formatDistanceToNow(userStatus.lastSeen.toDate(), { addSuffix: true });

    return (
      <div className='flex items-center space-x-1'>
        <div className={`${sizeClasses[size]} ${statusColor} rounded-full border-2 border-white`} />
        <span className='text-xs text-gray-500'>Last seen {lastSeenText}</span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${statusColor} rounded-full border-2 border-white`}
      title={userStatus.status === 'online' ? 'Online' : 'Offline'}
    />
  );
}

export default OnlineStatusIndicator;
