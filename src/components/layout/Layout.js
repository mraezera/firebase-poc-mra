import React, { useState } from 'react';
import ConversationList from '../conversations/ConversationList';
import ConversationArea from '../messages/ConversationArea';
import ConversationDetails from '../conversations/ConversationDetails';

function Layout({ user }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Left Sidebar - Conversation List */}
      <div className="w-80 bg-background-card border-r border-gray-200 flex-shrink-0 h-full overflow-hidden">
        <ConversationList
          user={user}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
        />
      </div>

      {/* Center Area - Messages */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ConversationArea
          user={user}
          conversation={selectedConversation}
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
        />
      </div>

      {/* Right Panel - Conversation Details */}
      {showRightPanel && selectedConversation && (
        <div className="w-80 bg-background-card flex-shrink-0 h-full overflow-hidden">
          <ConversationDetails
            conversation={selectedConversation}
            currentUser={user}
            onClose={() => setShowRightPanel(false)}
          />
        </div>
      )}
    </div>
  );
}

export default Layout;
