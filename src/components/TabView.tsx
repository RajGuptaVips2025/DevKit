import { useEffect, useState } from 'react';
import { Code2, Eye, ListChecks, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';

interface TabViewProps {
  activeTab: 'steps' | 'files' | 'code' | 'preview';
  onTabChange: (tab: 'steps' | 'files' | 'code' | 'preview') => void;
  loading?: boolean;
  showStepsOnMobile?: boolean; // default true
}

export function TabView({
  activeTab,
  onTabChange,
  loading,
  showStepsOnMobile = true,
}: TabViewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 754);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    ...(isMobile
      ? [
          ...(showStepsOnMobile ? [{ key: 'steps', label: 'Steps', icon: <ListChecks className="w-4 h-4" /> }] : []),
          { key: 'files', label: 'Files', icon: <FolderTree className="w-4 h-4" /> },
        ]
      : []),
    { key: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" /> },
    { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: TabViewProps['activeTab']) => {
    if (tab === activeTab) return;
    if (loading && tab === 'preview') return;
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
          disabled={loading && tab.key === 'preview'}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
            ${activeTab === tab.key ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}
            ${loading && tab.key === 'preview' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}













// import { useEffect, useState } from 'react';
// import { Code2, Eye, ListChecks, FolderTree } from 'lucide-react';
// import toast from 'react-hot-toast';

// interface TabViewProps {
//   activeTab: 'steps' | 'files' | 'code' | 'preview';
//   onTabChange: (tab: 'steps' | 'files' | 'code' | 'preview') => void;
//   loading?: boolean; // 👈 add this
// }

// export function TabView({ activeTab, onTabChange, loading  }: TabViewProps) {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth < 768);
//     checkMobile();

//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   const tabs = [
//     ...(isMobile
//       ? [
//         { key: 'steps', label: 'Steps', icon: <ListChecks className="w-4 h-4" /> },
//         { key: 'files', label: 'Files', icon: <FolderTree className="w-4 h-4" /> },
//       ]
//       : []),
//     { key: 'code', label: 'Code', icon: <Code2 className="w-4 h-4" /> },
//     { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
//   ];

//   const handleTabClick = (tab: TabViewProps['activeTab']) => {
//     if (tab === activeTab) return;
//     if (loading && tab === 'preview') return;
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
//           disabled={loading && tab.key === 'preview'} // 👈 disable Preview while loading
//           className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors
//       ${activeTab === tab.key
//               ? 'bg-gray-700 text-gray-100'
//               : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}
//       ${loading && tab.key === 'preview' ? 'opacity-50 cursor-not-allowed' : ''}`}
//         >
//           {tab.icon}
//           {tab.label}
//         </button>
//       ))}

//     </div>
//   );
// }
