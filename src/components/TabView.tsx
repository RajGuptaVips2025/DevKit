import React from 'react';
import { Code2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface TabViewProps {
  activeTab: 'code' | 'preview';
  onTabChange: (tab: 'code' | 'preview') => void;
}

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  const handleTabClick = (tab: 'code' | 'preview') => {
    if (tab === activeTab) return;

    onTabChange(tab);

    toast.success(`Switched to ${tab} view`, {
      id: 'tab-switch-toast', // This ensures the toast is reused instead of stacking
      duration: 1500, // Optional: keep it short
    });
  };

  return (
    <div className="flex space-x-2 mb-4 ">
      <button
        onClick={() => handleTabClick('code')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'code'
            ? 'bg-gray-700 text-gray-100'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
        }`}
      >
        <Code2 className="w-4 h-4" />
        Code
      </button>
      <button
        onClick={() => handleTabClick('preview')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          activeTab === 'preview'
            ? 'bg-gray-700 text-gray-100'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
        }`}
      >
        <Eye className="w-4 h-4" />
        Preview
      </button>
    </div>
  );
}

