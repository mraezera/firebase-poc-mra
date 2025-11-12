import React, { useState, useEffect } from 'react';

/**
 * Appearance settings tab
 */
function AppearanceSettings() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || 'blue';
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply accent color
    document.documentElement.style.setProperty('--accent-color', getAccentColorValue(accentColor));
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => {
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const getAccentColorValue = (color) => {
    const colors = {
      blue: '#3b82f6',
      purple: '#8b5cf6',
      green: '#10b981',
      red: '#ef4444',
      orange: '#f97316',
      pink: '#ec4899'
    };
    return colors[color] || colors.blue;
  };

  const accentColors = [
    { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { name: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { name: 'green', label: 'Green', color: 'bg-green-500' },
    { name: 'red', label: 'Red', color: 'bg-red-500' },
    { name: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { name: 'pink', label: 'Pink', color: 'bg-pink-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
        <p className="text-sm text-gray-600 mb-6">Customize the look and feel of your chat experience</p>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Theme
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 border-2 rounded-lg transition-all ${
              theme === 'light'
                ? 'border-primary bg-primary-light'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-white border border-gray-300 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Light</div>
                <div className="text-xs text-gray-600">Default theme</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 border-2 rounded-lg transition-all ${
              theme === 'dark'
                ? 'border-primary bg-primary-light'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Dark</div>
                <div className="text-xs text-gray-600">Easy on the eyes</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Accent Color
        </label>
        <div className="grid grid-cols-3 gap-3">
          {accentColors.map(color => (
            <button
              key={color.name}
              onClick={() => setAccentColor(color.name)}
              className={`p-3 border-2 rounded-lg transition-all ${
                accentColor === color.name
                  ? 'border-primary'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full ${color.color}`} />
                <span className="text-sm font-medium text-gray-900">{color.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Font Size
        </label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'small', label: 'Small', size: 'text-sm' },
            { value: 'medium', label: 'Medium', size: 'text-base' },
            { value: 'large', label: 'Large', size: 'text-lg' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFontSize(option.value)}
              className={`p-4 border-2 rounded-lg transition-all ${
                fontSize === option.value
                  ? 'border-primary bg-primary-light'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className={`font-medium text-gray-900 ${option.size}`}>
                {option.label}
              </div>
              <div className="text-xs text-gray-600 mt-1">Aa</div>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">Note</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your appearance settings are saved locally and will persist across sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceSettings;
