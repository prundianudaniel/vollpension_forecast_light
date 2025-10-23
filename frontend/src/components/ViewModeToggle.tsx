import React from 'react';

interface ViewModeToggleProps {
  viewMode: 'weekly' | 'monthly';
  onToggle: () => void;
}

export default function ViewModeToggle({ viewMode, onToggle }: ViewModeToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
        <span className={`text-sm font-medium ${viewMode === 'weekly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Wöchentlich
        </span>
        <label htmlFor="toggle-view" className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              id="toggle-view"
              className="sr-only"
              checked={viewMode === 'monthly'}
              onChange={onToggle}
            />
            <div className={`block w-12 h-6 rounded-full transition-colors ${
              viewMode === 'monthly' ? 'bg-blue-600' : 'bg-gray-300'
            }`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
              viewMode === 'monthly' ? 'transform translate-x-6' : ''
            }`}></div>
          </div>
        </label>
        <span className={`text-sm font-medium ${viewMode === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Monatlich
        </span>
      </div>
    </div>
  );
}
