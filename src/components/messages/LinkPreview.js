import React from 'react';

/**
 * Component to display a link preview card
 */
function LinkPreview({ url, title, description, image, favicon }) {
  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Extract domain from URL for display
  const getDomain = urlString => {
    try {
      const urlObj = new URL(urlString);

      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return urlString;
    }
  };

  return (
    <div
      onClick={handleClick}
      className='mt-2 border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 cursor-pointer transition-colors max-w-md'
    >
      {/* Image */}
      {image && (
        <div className='w-full h-48 bg-gray-100 overflow-hidden'>
          <img
            src={image}
            alt={title || 'Link preview'}
            className='w-full h-full object-cover'
            onError={e => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className='p-3 space-y-1'>
        {/* Title */}
        {title && <h4 className='font-semibold text-sm text-gray-900 line-clamp-2'>{title}</h4>}

        {/* Description */}
        {description && <p className='text-xs text-gray-600 line-clamp-2'>{description}</p>}

        {/* URL/Domain */}
        <div className='flex items-center space-x-2 pt-1'>
          {favicon && (
            <img
              src={favicon}
              alt=''
              className='w-4 h-4'
              onError={e => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <span className='text-xs text-gray-500 truncate'>{getDomain(url)}</span>
        </div>
      </div>
    </div>
  );
}

export default LinkPreview;
