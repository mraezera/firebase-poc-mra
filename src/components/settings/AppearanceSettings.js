import React, { useEffect, useState } from 'react';

/**
 * Appearance settings tab
 */
function AppearanceSettings() {
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || 'blue';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });

  useEffect(() => {
    // Apply accent color
    const colorValues = getAccentColorValues(accentColor);
    document.documentElement.style.setProperty('--accent-color', colorValues.default);
    document.documentElement.style.setProperty('--accent-color-dark', colorValues.dark);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => {
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const getAccentColorValues = color => {
    const colors = {
      blue: { default: '#3b82f6', dark: '#2563eb' },
      purple: { default: '#8b5cf6', dark: '#7c3aed' },
      green: { default: '#10b981', dark: '#059669' },
      red: { default: '#ef4444', dark: '#dc2626' },
      orange: { default: '#f97316', dark: '#ea580c' },
      pink: { default: '#ec4899', dark: '#db2777' },
    };

    return colors[color] || colors.blue;
  };

  const accentColors = [
    { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { name: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { name: 'green', label: 'Green', color: 'bg-green-500' },
    { name: 'red', label: 'Red', color: 'bg-red-500' },
    { name: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { name: 'pink', label: 'Pink', color: 'bg-pink-500' },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Appearance Settings</h3>
        <p className='text-sm text-gray-600 mb-6'>Customize the look and feel of your chat experience</p>
      </div>

      {/* Accent Color */}
      <div>
        <div className='block text-sm font-medium text-gray-700 mb-3'>Accent Color</div>
        <div className='grid grid-cols-3 gap-3'>
          {accentColors.map(color => (
            <button
              key={color.name}
              onClick={() => setAccentColor(color.name)}
              className={`p-3 border-2 rounded-lg transition-all ${
                accentColor === color.name ? 'border-primary' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className='flex items-center space-x-2'>
                <div className={`w-6 h-6 rounded-full ${color.color}`} />
                <span className='text-sm font-medium text-gray-900'>{color.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <div className='block text-sm font-medium text-gray-700 mb-3'>Font Size</div>
        <div className='grid grid-cols-3 gap-4'>
          {[
            { value: 'small', label: 'Small', size: 'text-sm' },
            { value: 'medium', label: 'Medium', size: 'text-base' },
            { value: 'large', label: 'Large', size: 'text-lg' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFontSize(option.value)}
              className={`p-4 border-2 rounded-lg transition-all ${
                fontSize === option.value ? 'border-primary bg-primary-light' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className={`font-medium text-gray-900 ${option.size}`}>{option.label}</div>
              <div className='text-xs text-gray-600 mt-1'>Aa</div>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <div className='flex items-start space-x-3'>
          <svg
            className='w-5 h-5 text-blue-600 mt-0.5'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
          <div className='flex-1'>
            <h4 className='text-sm font-medium text-blue-900'>Note</h4>
            <p className='text-sm text-blue-700 mt-1'>
              Your appearance settings are saved locally and will persist across sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceSettings;
