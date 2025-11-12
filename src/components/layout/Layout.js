import React, { useState } from 'react';
import ConversationList from '../conversations/ConversationList';
import ConversationArea from '../messages/ConversationArea';

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

      {/* Right Panel - Info/Details (initially hidden) */}
      {showRightPanel && (
        <div className="w-80 bg-background-card border-l border-gray-200 flex-shrink-0">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Conversation Details
            </h3>
            {selectedConversation && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Conversation Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedConversation.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-medium text-gray-900">
                    {selectedConversation.participants?.length || 0} members
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
