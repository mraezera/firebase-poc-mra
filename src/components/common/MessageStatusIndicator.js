import React from 'react';
import clsx from 'clsx';

/**
 * Shows message delivery status for sent messages
 * - Sent: Single checkmark (gray)
 * - Delivered: Double checkmark (gray)
 * - Read: Double checkmark (blue)
 */
function MessageStatusIndicator({ status, readBy = {}, deliveredTo = {}, currentUserId }) {
  // Don't show status for received messages
  if (!status) return null;

  // Check if message has been read by anyone (excluding sender)
  const isRead = Object.keys(readBy).some(userId => userId !== currentUserId);

  // Check if message has been delivered to anyone (excluding sender)
  const isDelivered = Object.keys(deliveredTo).some(userId => userId !== currentUserId);

  // Determine which icon to show
  let icon;
  let color;

  if (isRead) {
    // Read - double checkmark in blue
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1.5 12.5l5-5 3.5 3.5L18.5 2.5l2 2L10 15l-3.5-3.5-5 1z" />
        <path d="M5.5 12.5l5-5 3.5 3.5L22.5 2.5l2 2L14 15l-3.5-3.5-5 1z" />
      </svg>
    );
    color = 'text-blue-500';
  } else if (isDelivered || status === 'delivered') {
    // Delivered - double checkmark in gray
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0.5 11l4-4 3 3 9-9 1.5 1.5L7 13.5 3.5 10 0.5 13z" transform="translate(2, 5)" />
        <path d="M0.5 11l4-4 3 3 9-9 1.5 1.5L7 13.5 3.5 10 0.5 13z" transform="translate(6, 5)" />
      </svg>
    );
    color = 'text-gray-400';
  } else if (status === 'sent') {
    // Sent - single checkmark in gray
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
    );
    color = 'text-gray-400';
  } else if (status === 'failed') {
    // Failed - exclamation mark in red
    icon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    );
    color = 'text-red-500';
  } else {
    // Sending - clock icon
    icon = (
      <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3" />
        <path d="M12 2v4c3.31 0 6 2.69 6 6h4c0-5.52-4.48-10-10-10z" />
      </svg>
    );
    color = 'text-gray-400';
  }

  return (
    <span className={clsx('inline-flex items-center', color)} title={getStatusText(status, isRead, isDelivered)}>
      {icon}
    </span>
  );
}

function getStatusText(status, isRead, isDelivered) {
  if (isRead) return 'Read';
  if (isDelivered) return 'Delivered';
  if (status === 'sent') return 'Sent';
  if (status === 'failed') return 'Failed to send';
  return 'Sending...';
}

export default MessageStatusIndicator;
