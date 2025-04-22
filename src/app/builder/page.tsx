'use client'

import React, { useEffect, useRef, useState } from 'react';
import { FileExplorer } from '../../components/FileExplorer';
import { CodeEditor } from '../../components/CodeEditor';
import { Step, FileItem, StepType } from '../types';
import { useWebContainer } from '../hooks/useWebContainer';
import { parseXml } from '../types/steps';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StepsList } from '@/components/StepsList';
import { Loader } from '@/components/Loader';
import { TabView } from '@/components/TabView';
import { PreviewFrame } from '@/components/PreviewFrame';
import Link from 'next/link';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Builder() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  const [userPrompt, setPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);

  // const mountedRef = useRef(false);

  const handleSend = async () => {
    if (!userPrompt.trim()) return;

    const newMessage = { role: 'user' as const, content: userPrompt };
    setLoading(true);
    setPrompt('');
    const stepsResponse = await axios.post(`/api/chat`, {
      messages: [...llmMessages, newMessage],
    });
    setLoading(false);

    const parsedSteps = parseXml(stepsResponse.data.response).map((x) => ({
      ...x,
      status: 'pending' as const,
    }));

    setLlmMessages((x) => [...x, newMessage, { role: 'assistant', content: stepsResponse.data.response }]);
    setSteps((s) => [...s, ...parsedSteps]);
    localStorage.setItem(`ai-steps-${prompt}`, JSON.stringify([...steps, ...parsedSteps]));
  };

  const init = async () => {
    const response = await axios.post(`/api/template`, { prompt: prompt?.trim() });
    setTemplateSet(true);
    const { prompts, uiPrompts } = response.data;

    const parsedInitialSteps = parseXml(uiPrompts[0]).map((x: Step) => ({ ...x, status: 'pending' }));
    setSteps(parsedInitialSteps);

    setLoading(true);
    const stepsResponse = await axios.post(`/api/chat`, {
      messages: [...prompts, prompt].map((p) => ({ role: 'user', parts: p })),
    });
    setLoading(false);

    const finalSteps = [
      ...parsedInitialSteps,
      ...parseXml(stepsResponse.data.response).map((x) => ({ ...x, status: 'pending' as const })),
    ];
    setSteps(finalSteps);

    setLlmMessages([
      ...prompts.map((p) => ({ role: 'user', content: p })),
      { role: 'user', content: prompt! },
      { role: 'assistant', content: stepsResponse.data.response },
    ]);

    localStorage.setItem(`ai-steps-${prompt}`, JSON.stringify(finalSteps));
    localStorage.setItem(`ai-files-${prompt}`, JSON.stringify([])); // will update when files are built
  };

  useEffect(() => {
    const cachedSteps = localStorage.getItem(`ai-steps-${prompt}`);
    const cachedFiles = localStorage.getItem(`ai-files-${prompt}`);

    if (cachedSteps) {
      setSteps(JSON.parse(cachedSteps));
      if (cachedFiles) setFiles(JSON.parse(cachedFiles));
      setTemplateSet(true);
    } else {
      init();
    }
  }, [prompt]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === 'pending')
      .forEach((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? [];
          let currentFileStructure = [...originalFiles];
          let finalAnswerRef = currentFileStructure;
          let currentFolder = '';

          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              let file = currentFileStructure.find((x) => x.path === currentFolder);
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              let folder = currentFileStructure.find((x) => x.path === currentFolder);
              if (!folder) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find((x) => x.path === currentFolder)!.children!;
            }
          }

          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s) => ({
          ...s,
          status: 'completed',
        }))
      );
      localStorage.setItem(`ai-files-${prompt}`, JSON.stringify(originalFiles));
    }
  }, [steps]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
      const processFile = (file: FileItem, isRootFolder: boolean): any => {
        if (file.type === 'folder') {
          mountStructure[file.name] = {
            directory: file.children
              ? Object.fromEntries(file.children.map((child) => [child.name, processFile(child, false)]))
              : {},
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || '',
              },
            };
          } else {
            return {
              file: {
                contents: file.content || '',
              },
            };
          }
        }
        return mountStructure[file.name];
      };
      files.forEach((file) => processFile(file, true));
      return mountStructure;
    };

    // if (!webcontainer || mountedRef.current) return;

    // const mountStructure = createMountStructure(files);
    // webcontainer.mount(mountStructure);
    // mountedRef.current = true;

    const mountStructure = createMountStructure(files);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  const handleRegenerate = () => {
    localStorage.removeItem(`ai-files-${prompt}`);
    localStorage.removeItem(`ai-steps-${prompt}`);
    setSteps([]);
    setFiles([]);
    setTemplateSet(false);
    init();
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
  
    const addFilesToZip = (zipFolder: JSZip, items: FileItem[]) => {
      items.forEach((item) => {
        if (item.type === 'folder' && item.children) {
          const newFolder = zipFolder.folder(item.name);
          if (newFolder) addFilesToZip(newFolder, item.children);
        } else if (item.type === 'file') {
          zipFolder.file(item.name || 'untitled.txt', item.content || '');
        }
      });
    };
  
    addFilesToZip(zip, files);
  
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${prompt || 'project'}-export.zip`);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="w-full bg-black border-b border-[#2c2c3a] px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-2xl tracking-tight">
          Hyper Gen
        </Link>

        <button
          className="text-white focus:outline-none hover:bg-[#2a2a3d] p-2 rounded transition-all duration-200"
          onClick={() => console.log('Hamburger clicked')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="px-4">
        <p className="text-sm text-white mt-1 italic">Prompt: {prompt}</p>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-2 p-2">
          <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 shadow-inner border border-[#2c2c3a] flex flex-col justify-between max-h-[calc(100vh-8rem)]">
            <h2 className="text-lg font-semibold text-white mb-2">🧠 Steps</h2>
            <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            <div className="mt-4 space-y-2">
              <h3 className="text-xs text-gray-400 uppercase mb-1">AI Assistant</h3>
              {loading || !templateSet ? (
                <Loader />
              ) : (
                <>
                  <div className="flex space-x-2 items-center mt-2">
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="What do you want to build?"
                      className="flex-1 bg-[#2a2a3d] text-white border border-[#3b3b4f] placeholder:text-gray-500 resize-none"
                    />
                    <Button onClick={handleSend}>Send</Button>
                  </div>
                  {/* <Button variant="outline" className="w-full" onClick={handleRegenerate}>
                    🔁 Regenerate from Scratch
                  </Button> */}
                </>
              )}
            </div>
          </div>

          {/* <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 text-white border border-[#2c2c3a] shadow-md">
            <h2 className="text-lg font-semibold mb-2">📁 File Explorer</h2>
            <Button onClick={handleExportZip} className="mt-2">
              Export ZIP
            </Button>
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div> */}

          <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 text-white border border-[#2c2c3a] shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">📁 File Explorer</h2>
              <Button onClick={handleExportZip}>
                Export ZIP
              </Button>
            </div>
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>


          <div className="col-span-2 rounded-xl p-4 h-[calc(100vh-8rem)] border border-[#2c2c3a] bg-[#1a1a1d] shadow-xl flex flex-col">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 mt-2 bg-black rounded-lg overflow-auto p-3 border border-[#2a2a3d]">
              {/* {activeTab === 'code' ? <CodeEditor file={selectedFile} /> : <PreviewFrame webContainer={webcontainer} files={files} />} */}
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <>
                  {!previewReady && (
                    <div className="mb-2 text-sm text-white">
                      Installing dependencies... {previewProgress}%
                      <div className="w-full h-2 bg-gray-700 rounded mt-1">
                        <div
                          className="h-2 bg-green-500 rounded"
                          style={{ width: `${previewProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <PreviewFrame
                    webContainer={webcontainer}
                    files={files}
                    onProgressUpdate={setPreviewProgress}
                    onReady={() => {
                      setPreviewProgress(100);
                      setPreviewReady(true);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// {!previewReady && (
//   <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-50">
//     <p className="text-white text-lg mb-4">Installing Dependencies...</p>
//     <div className="w-2/3 bg-gray-800 rounded-full h-3 overflow-hidden">
//       <div
//         className="bg-blue-500 h-full transition-all duration-200"
//         style={{ width: `${previewProgress}%` }}
//       />
//     </div>
//     <p className="text-white mt-2 text-sm">{previewProgress}%</p>
//   </div>
// )}
















// 'use client'

// import React, { useEffect, useState } from 'react';
// import { FileExplorer } from '../../components/FileExplorer';
// import { CodeEditor } from '../../components/CodeEditor';
// import { Step, FileItem, StepType } from '../types';
// import { useWebContainer } from '../hooks/useWebContainer';
// import { parseXml } from '../types/steps';
// import { useSearchParams } from 'next/navigation';
// import axios from 'axios';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { Send } from 'lucide-react';
// import { StepsList } from '@/components/StepsList';
// import { Loader } from '@/components/Loader';
// import { TabView } from '@/components/TabView';
// import { PreviewFrame } from '@/components/PreviewFrame';
// import Link from 'next/link';

// export default function Builder() {
//   const searchParams = useSearchParams();
//   const prompt = searchParams.get('prompt');
//   const [userPrompt, setPrompt] = useState("");
//   const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [templateSet, setTemplateSet] = useState(false);
//   const webcontainer = useWebContainer();

//   const [currentStep, setCurrentStep] = useState(1);
//   const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
//   const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

//   const [steps, setSteps] = useState<Step[]>([]);

//   const [files, setFiles] = useState<FileItem[]>([]);


//   interface Message {
//     id: number
//     content: string
//     timestamp: Date
//   }


//   const [messages, setMessages] = useState<Message[]>([])
//   const [input, setInput] = useState('')

//   const handleSend = () => {
//     if (!input.trim()) return

//     setMessages([...messages, {
//       id: Date.now(),
//       content: input,
//       timestamp: new Date()
//     }])
//     setInput('')
//   }

//   useEffect(() => {
//     let originalFiles = [...files];
//     let updateHappened = false;
//     steps.filter(({ status }) => status === "pending").map(step => {
//       updateHappened = true;
//       if (step?.type === StepType.CreateFile) {
//         let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
//         let currentFileStructure = [...originalFiles]; // {}
//         let finalAnswerRef = currentFileStructure;

//         let currentFolder = ""
//         while (parsedPath.length) {
//           currentFolder = `${currentFolder}/${parsedPath[0]}`;
//           let currentFolderName = parsedPath[0];
//           parsedPath = parsedPath.slice(1);

//           if (!parsedPath.length) {
//             // final file
//             let file = currentFileStructure.find(x => x.path === currentFolder)
//             if (!file) {
//               currentFileStructure.push({
//                 name: currentFolderName,
//                 type: 'file',
//                 path: currentFolder,
//                 content: step.code
//               })
//             } else {
//               file.content = step.code;
//             }
//           } else {
//             /// in a folder
//             let folder = currentFileStructure.find(x => x.path === currentFolder)
//             if (!folder) {
//               // create the folder
//               currentFileStructure.push({
//                 name: currentFolderName,
//                 type: 'folder',
//                 path: currentFolder,
//                 children: []
//               })
//             }

//             currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
//           }
//         }
//         originalFiles = finalAnswerRef;
//       }

//     })

//     if (updateHappened) {

//       setFiles(originalFiles)
//       setSteps(steps => steps.map((s: Step) => {
//         return {
//           ...s,
//           status: "completed"
//         }

//       }))
//     }
//     // console.log(files);
//   }, [steps, files]);

//   useEffect(() => {
//     const createMountStructure = (files: FileItem[]): Record<string, any> => {
//       const mountStructure: Record<string, any> = {};

//       const processFile = (file: FileItem, isRootFolder: boolean) => {
//         if (file.type === 'folder') {
//           // For folders, create a directory entry
//           mountStructure[file.name] = {
//             directory: file.children ?
//               Object.fromEntries(
//                 file.children.map(child => [child.name, processFile(child, false)])
//               )
//               : {}
//           };
//         } else if (file.type === 'file') {
//           if (isRootFolder) {
//             mountStructure[file.name] = {
//               file: {
//                 contents: file.content || ''
//               }
//             };
//           } else {
//             // For files, create a file entry with contents
//             return {
//               file: {
//                 contents: file.content || ''
//               }
//             };
//           }
//         }

//         return mountStructure[file.name];
//       };

//       // Process each top-level file/folder
//       files.forEach(file => processFile(file, true));

//       return mountStructure;
//     };

//     const mountStructure = createMountStructure(files);

//     // Mount the structure if WebContainer is available
//     // console.log(mountStructure);
//     webcontainer?.mount(mountStructure);
//   }, [files, webcontainer]);

//   async function init() {
//     const response = await axios.post(`/api/template`, {
//       prompt: prompt?.trim()
//     });
//     setTemplateSet(true);
//     // console.log(response.data)
//     const { prompts, uiPrompts } = response.data;

//     setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
//       ...x,
//       status: "pending"
//     })));

//     setLoading(true);
//     const stepsResponse = await axios.post(`/api/chat`, {
//       messages: [...prompts, prompt].map(parts => ({
//         role: "user",
//         parts
//       }))
//     })

//     setLoading(false);
//     // console.log(stepsResponse.data.response)
//     setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
//       ...x,
//       status: "pending" as "pending"
//     }))]);

//     setLlmMessages([...prompts, prompt].map(content => ({
//       role: "user",
//       content
//     })));

//     setLlmMessages(x => [...x, { role: "assistant", content: stepsResponse.data.response }])
//   }

//   useEffect(() => {
//     init();
//   }, [])

//   return (
//     <div className="min-h-screen bg-black flex flex-col">

//         <div className="w-full   bg-black border-b border-[#2c2c3a] px-6 py-3 flex justify-between items-center">
//           {/* Logo Section */}
//           <Link href="/" className="text-white font-bold text-2xl tracking-tight">
//             DevKit
//           </Link>

//           {/* Hamburger Icon */}
//           <button
//             className="text-white focus:outline-none hover:bg-[#2a2a3d] p-2 rounded transition-all duration-200"
//             onClick={() => {
//               // Toggle something (like sidebar)
//               console.log('Hamburger clicked');
//             }}
//             >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-6 w-6"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
//         </div>

//         <div className='px-4'>
//           <p className="text-sm text-white mt-1 italic">Prompt: {prompt}</p>
//         </div>


//       <main className="flex-1 overflow-hidden">
//         <div className="h-full grid grid-cols-4 gap-2 p-2">
//           {/* Steps List Section */}
//           <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 shadow-inner border border-[#2c2c3a] flex flex-col justify-between max-h-[calc(100vh-8rem)]">
//               <h2 className="text-lg font-semibold text-white mb-2">🧠 Steps</h2>
//               <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
//               <div className="mt-4">
//                 <h3 className="text-xs text-gray-400 uppercase mb-1">AI Assistant</h3>
//                 {(loading || !templateSet) ? (
//                   <Loader />
//                 ) : (
//                   <div className="flex space-x-2 items-center mt-2">
//                     <Textarea
//                       value={userPrompt}
//                       onChange={(e) => setPrompt(e.target.value)}
//                       placeholder="What do you want to build?"
//                       className="flex-1 bg-[#2a2a3d] text-white border border-[#3b3b4f] placeholder:text-gray-500 resize-none"
//                     />
//                     <Button variant={'default'}
//                       onClick={async () => {
//                         const newMessage = { role: 'user' as 'user', content: userPrompt };
//                         setLoading(true);
//                         setPrompt('');
//                         const stepsResponse = await axios.post(`/api/chat`, {
//                           messages: [...llmMessages, newMessage],
//                         });
//                         setLoading(false);

//                         setLlmMessages((x) => [...x, newMessage]);
//                         setLlmMessages((x) => [...x, { role: 'assistant', content: stepsResponse.data.response }]);
//                         setSteps((s) => [
//                           ...s,
//                           ...parseXml(stepsResponse.data.response).map((x) => ({
//                             ...x,
//                             status: 'pending' as 'pending',
//                           })),
//                         ]);
//                       }}
//                       className=""
//                     >
//                       Send
//                     </Button>
//                   </div>
//                 )}
//               </div>
//           </div>


//           {/* File Explorer Section */}
//           <div className="col-span-1 bg-[#1a1a1d] rounded-xl p-4 text-white border border-[#2c2c3a] shadow-md">
//             <h2 className="text-lg font-semibold mb-2">📁 File Explorer</h2>
//             <FileExplorer files={files} onFileSelect={setSelectedFile} />
//           </div>


//           {/* Code Editor and Preview Section */}
//           <div className="col-span-2 rounded-xl p-4 h-[calc(100vh-8rem)] border border-[#2c2c3a] bg-[#1a1a1d] shadow-xl flex flex-col">
//             <TabView activeTab={activeTab} onTabChange={setActiveTab} />
//             <div className="flex-1 mt-2 bg-black rounded-lg overflow-auto p-3 border border-[#2a2a3d]">
//               {activeTab === 'code' ? (
//                 <CodeEditor file={selectedFile} />
//               ) : (
//                 <PreviewFrame webContainer={webcontainer} files={files} />
//               )}
//             </div>
//           </div>

//         </div>
//       </main>
//     </div>
//   );
// }

