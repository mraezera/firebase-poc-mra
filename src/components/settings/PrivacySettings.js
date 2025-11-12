import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Privacy and chat settings tab
 */
function PrivacySettings({ user }) {
  const [settings, setSettings] = useState({
    readReceipts: true,
    typingIndicators: true,
    lastSeen: true,
    onlineStatus: true,
    profilePhotoVisibility: 'everyone',
    whoCanMessage: 'everyone',
    whoCanAddToGroups: 'everyone',
    autoDownloadMedia: true,
    saveToGallery: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('privacySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Save to localStorage
      localStorage.setItem('privacySettings', JSON.stringify(settings));

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        privacySettings: settings,
        updatedAt: new Date()
      });

      setMessage('Privacy settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setMessage('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
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

  const SelectOption = ({ value, onChange, label, description, options }) => (
    <div className="py-3">
      <h4 className="text-sm font-medium text-gray-900 mb-1">{label}</h4>
      {description && <p className="text-xs text-gray-600 mb-2">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const visibilityOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'contacts', label: 'My Contacts' },
    { value: 'nobody', label: 'Nobody' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h3>
        <p className="text-sm text-gray-600 mb-6">Control who can see your information and how you interact</p>
      </div>

      {/* Activity Status */}
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity Status</h4>
        <ToggleSwitch
          enabled={settings.readReceipts}
          onChange={() => handleToggle('readReceipts')}
          label="Read Receipts"
          description="Let others know when you've read their messages"
        />
        <ToggleSwitch
          enabled={settings.typingIndicators}
          onChange={() => handleToggle('typingIndicators')}
          label="Typing Indicators"
          description="Show when you're typing a message"
        />
        <ToggleSwitch
          enabled={settings.lastSeen}
          onChange={() => handleToggle('lastSeen')}
          label="Last Seen"
          description="Let others see when you were last online"
        />
        <ToggleSwitch
          enabled={settings.onlineStatus}
          onChange={() => handleToggle('onlineStatus')}
          label="Online Status"
          description="Show when you're currently online"
        />
      </div>

      <div className="border-t border-gray-200" />

      {/* Visibility Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Who can see my</h4>
        <SelectOption
          value={settings.profilePhotoVisibility}
          onChange={(value) => handleSelectChange('profilePhotoVisibility', value)}
          label="Profile Photo"
          description="Choose who can see your profile photo"
          options={visibilityOptions}
        />
      </div>

      <div className="border-t border-gray-200" />

      {/* Messaging Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Messaging</h4>
        <SelectOption
          value={settings.whoCanMessage}
          onChange={(value) => handleSelectChange('whoCanMessage', value)}
          label="Who can message me"
          description="Control who can send you messages"
          options={visibilityOptions}
        />
        <SelectOption
          value={settings.whoCanAddToGroups}
          onChange={(value) => handleSelectChange('whoCanAddToGroups', value)}
          label="Who can add me to groups"
          description="Control who can add you to group conversations"
          options={visibilityOptions}
        />
      </div>

      <div className="border-t border-gray-200" />

      {/* Media Settings */}
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Media</h4>
        <ToggleSwitch
          enabled={settings.autoDownloadMedia}
          onChange={() => handleToggle('autoDownloadMedia')}
          label="Auto-download Media"
          description="Automatically download images and files"
        />
        <ToggleSwitch
          enabled={settings.saveToGallery}
          onChange={() => handleToggle('saveToGallery')}
          label="Save to Gallery"
          description="Automatically save received images to your device"
        />
      </div>

      <div className="border-t border-gray-200" />

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">Your Privacy Matters</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your messages are encrypted and your privacy settings are respected. We never share your data with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default PrivacySettings;
