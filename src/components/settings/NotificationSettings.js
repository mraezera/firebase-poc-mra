import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

import { db } from '../../firebase/config';

/**
 * Notification settings tab
 */
function NotificationSettings({ user }) {
  const [settings, setSettings] = useState({
    enableNotifications: true,
    soundEnabled: true,
    desktopNotifications: true,
    messagePreview: true,
    notifyOnMention: true,
    notifyOnReply: true,
    notifyOnReaction: true,
    doNotDisturb: false,
    dndStart: '22:00',
    dndEnd: '08:00',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleToggle = key => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(settings));

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings: settings,
        updatedAt: new Date(),
      });

      setMessage('Notification settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className='flex items-center justify-between py-3'>
      <div className='flex-1'>
        <h4 className='text-sm font-medium text-gray-900'>{label}</h4>
        {description && <p className='text-xs text-gray-600 mt-0.5'>{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Notification Preferences</h3>
        <p className='text-sm text-gray-600 mb-6'>Manage how and when you receive notifications</p>
      </div>

      {/* General Notifications */}
      <div className='space-y-1'>
        <h4 className='text-sm font-semibold text-gray-900 mb-3'>General</h4>
        <ToggleSwitch
          enabled={settings.enableNotifications}
          onChange={() => handleToggle('enableNotifications')}
          label='Enable Notifications'
          description='Receive notifications for new messages'
        />
        <ToggleSwitch
          enabled={settings.soundEnabled}
          onChange={() => handleToggle('soundEnabled')}
          label='Sound'
          description='Play a sound when you receive a notification'
        />
        <ToggleSwitch
          enabled={settings.desktopNotifications}
          onChange={() => handleToggle('desktopNotifications')}
          label='Desktop Notifications'
          description='Show desktop notifications even when the app is open'
        />
        <ToggleSwitch
          enabled={settings.messagePreview}
          onChange={() => handleToggle('messagePreview')}
          label='Message Preview'
          description='Show message content in notifications'
        />
      </div>

      <div className='border-t border-gray-200' />

      {/* Specific Notifications */}
      <div className='space-y-1'>
        <h4 className='text-sm font-semibold text-gray-900 mb-3'>Notify me when</h4>
        <ToggleSwitch
          enabled={settings.notifyOnMention}
          onChange={() => handleToggle('notifyOnMention')}
          label='Someone mentions me'
          description="Get notified when you're @mentioned in a message"
        />
        <ToggleSwitch
          enabled={settings.notifyOnReply}
          onChange={() => handleToggle('notifyOnReply')}
          label='Someone replies to my message'
          description='Get notified when someone replies to your message'
        />
        <ToggleSwitch
          enabled={settings.notifyOnReaction}
          onChange={() => handleToggle('notifyOnReaction')}
          label='Someone reacts to my message'
          description='Get notified when someone adds a reaction to your message'
        />
      </div>

      <div className='border-t border-gray-200' />

      {/* Do Not Disturb */}
      <div className='space-y-3'>
        <h4 className='text-sm font-semibold text-gray-900'>Do Not Disturb</h4>
        <ToggleSwitch
          enabled={settings.doNotDisturb}
          onChange={() => handleToggle('doNotDisturb')}
          label='Enable Do Not Disturb'
          description='Mute all notifications during specified hours'
        />

        {settings.doNotDisturb && (
          <div className='ml-4 space-y-3 p-4 bg-gray-50 rounded-lg'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>Start Time</label>
                <input
                  type='time'
                  value={settings.dndStart}
                  onChange={e => handleTimeChange('dndStart', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>End Time</label>
                <input
                  type='time'
                  value={settings.dndEnd}
                  onChange={e => handleTimeChange('dndEnd', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                />
              </div>
            </div>
            <p className='text-xs text-gray-600'>
              Notifications will be muted from {settings.dndStart} to {settings.dndEnd}
            </p>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {message}
        </div>
      )}

      {/* Save Button */}
      <div className='flex justify-end pt-4 border-t border-gray-200'>
        <button
          onClick={handleSave}
          disabled={saving}
          className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default NotificationSettings;
