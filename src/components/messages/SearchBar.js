import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

/**
 * Search bar component for searching within messages
 */
function SearchBar({ onSearch, onClear, resultsCount = 0, currentIndex = 0, onNext, onPrevious }) {
  const [searchText, setSearchText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch(searchText.trim());
    }
  };

  const handleClear = () => {
    setSearchText('');
    setIsExpanded(false);
    if (onClear) {
      onClear();
    }
  };

  const handleChange = e => {
    const value = e.target.value;
    setSearchText(value);

    // Auto-search as user types (debounced in parent)
    if (value.trim()) {
      onSearch(value.trim());
    } else if (onClear) {
      onClear();
    }
  };

  const hasResults = resultsCount > 0;

  return (
    <div className='flex items-center space-x-2'>
      {/* Search Toggle Button (when collapsed) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className='p-2 hover:bg-gray-100 rounded-full transition-colors'
          title='Search messages'
        >
          <svg
            className='w-5 h-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </button>
      )}

      {/* Expanded Search Bar */}
      {isExpanded && (
        <div className='flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 max-w-md'>
          {/* Search Icon */}
          <svg
            className='w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>

          {/* Search Input */}
          <form
            onSubmit={handleSubmit}
            className='flex-1'
          >
            <input
              type='text'
              value={searchText}
              onChange={handleChange}
              placeholder='Search in conversation...'
              aria-label='Search in conversation'
              className='w-full outline-none text-sm'
              autoFocus
            />
          </form>

          {/* Results Counter */}
          {searchText && (
            <div className='flex items-center space-x-2'>
              {hasResults ? (
                <span className='text-xs text-gray-600 whitespace-nowrap'>
                  {currentIndex + 1} of {resultsCount}
                </span>
              ) : (
                <span className='text-xs text-gray-400'>No results</span>
              )}

              {/* Navigation Buttons */}
              {hasResults && (
                <>
                  <button
                    onClick={onPrevious}
                    className={clsx(
                      'p-1 rounded hover:bg-gray-100 transition-colors',
                      currentIndex === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={currentIndex === 0}
                    title='Previous result'
                  >
                    <svg
                      className='w-4 h-4 text-gray-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 15l7-7 7 7'
                      />
                    </svg>
                  </button>
                  <button
                    onClick={onNext}
                    className={clsx(
                      'p-1 rounded hover:bg-gray-100 transition-colors',
                      currentIndex === resultsCount - 1 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={currentIndex === resultsCount - 1}
                    title='Next result'
                  >
                    <svg
                      className='w-4 h-4 text-gray-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className='p-1 hover:bg-gray-100 rounded transition-colors'
            title='Clear search'
          >
            <svg
              className='w-4 h-4 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  resultsCount: PropTypes.number,
  currentIndex: PropTypes.number,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
};

export default SearchBar;
