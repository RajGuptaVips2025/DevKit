// // import React from 'react';
// // import { Code2, Eye } from 'lucide-react';
// // import toast from 'react-hot-toast';

// // interface TabViewProps {
// //   activeTab: 'code' | 'preview';
// //   onTabChange: (tab: 'code' | 'preview') => void;
// // }

// // export function TabView({ activeTab, onTabChange }: TabViewProps) {
// //   const handleTabClick = (tab: 'code' | 'preview') => {
// //     if (tab === activeTab) return;

// //     onTabChange(tab);

// //     toast.success(`Switched to ${tab} view`, {
// //       id: 'tab-switch-toast', // This ensures the toast is reused instead of stacking
// //       duration: 1500, // Optional: keep it short
// //     });
// //   };

// //   return (
// //     <div className="flex space-x-2 mb-4 ">
// //       <button
// //         onClick={() => handleTabClick('code')}
// //         className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
// //           activeTab === 'code'
// //             ? 'bg-gray-700 text-gray-100'
// //             : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
// //         }`}
// //       >
// //         <Code2 className="w-4 h-4" />
// //         Code
// //       </button>
// //       <button
// //         onClick={() => handleTabClick('preview')}
// //         className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
// //           activeTab === 'preview'
// //             ? 'bg-gray-700 text-gray-100'
// //             : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
// //         }`}
// //       >
// //         <Eye className="w-4 h-4" />
// //         Preview
// //       </button>
// //     </div>
// //   );
// // }



// import { Code2, Eye, ListChecks, FolderTree } from 'lucide-react';
// import toast from 'react-hot-toast';

// interface TabViewProps {
//   activeTab: 'steps' | 'files' | 'code' | 'preview';
//   onTabChange: (tab: 'steps' | 'files' | 'code' | 'preview') => void;
// }

// export function TabView({ activeTab, onTabChange }: TabViewProps) {
//   const tabs = [
//     { key: 'steps', label: 'Steps', icon: <ListChecks className="w-4 h-4" /> },
//     { key: 'files', label: 'Files', icon: <FolderTree className="w-4 h-4" /> },
//     { key: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" /> },
//     { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
//   ];

//   const handleTabClick = (tab: TabViewProps['activeTab']) => {
//     if (tab === activeTab) return;
//     onTabChange(tab);
//     toast.success(`Switched to ${tab} view`, {
//       id: 'tab-switch-toast',
//       duration: 1500,
//     });
//   };

//   return (
//     <div className="flex space-x-2 mb-4">
//       {tabs.map((tab) => (
//         <button
//           key={tab.key}
//           onClick={() => handleTabClick(tab.key as any)}
//           className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
//             activeTab === tab.key
//               ? 'bg-gray-700 text-gray-100'
//               : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
//           }`}
//         >
//           {tab.icon}
//           {tab.label}
//         </button>
//       ))}
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { Code2, Eye, ListChecks, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';

interface TabViewProps {
  activeTab: 'steps' | 'files' | 'code' | 'preview';
  onTabChange: (tab: 'steps' | 'files' | 'code' | 'preview') => void;
}

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    ...(isMobile
      ? [
          { key: 'steps', label: 'Steps', icon: <ListChecks className="w-4 h-4" /> },
          { key: 'files', label: 'Files', icon: <FolderTree className="w-4 h-4" /> },
        ]
      : []),
    { key: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" /> },
    { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: TabViewProps['activeTab']) => {
    if (tab === activeTab) return;
    onTabChange(tab);
    toast.success(`Switched to ${tab} view`, {
      id: 'tab-switch-toast',
      duration: 1500,
    });
  };

  return (
    <div className="flex space-x-2 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab.key as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === tab.key
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
