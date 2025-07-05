"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FileExplorer } from '../../components/FileExplorer';
import { CodeEditor } from '../../components/CodeEditor';
import { Step, FileItem, StepType } from '../types';
import { useWebContainer } from '../hooks/useWebContainer';
import { parseXml } from '../types/steps';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const hydratedRef = useRef(false);
  const filesInitializedRef = useRef(false);
  // hydratedRef: Ensures we don't re-initialize the app multiple times (used in useEffect).
  // filesInitializedRef: Unused here but seems intended to track if file system has been mounted.
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt');
  if (!prompt) {
  return (
      <div className="text-white text-center p-4">
        No prompt provided in URL. Please use <code>?prompt=your_text</code> in the address bar.
      </div>
    );
  }

  // Fetches the prompt from the URL query string (like ?prompt=build app).
  const route = useRouter();
  // Next.js router for navigation (though not used here yet).
  const [userPrompt, setPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  // userPrompt: For the prompt input box.
  // llmMessages: Chat history between user & assistant.
  // loading: Shows spinner during async calls.
  // templateSet: Ensures prompt has been initialized.

  const webcontainer = useWebContainer();
  // Custom hook that returns a WebContainer (virtual Linux filesystem + browser environment).

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  // currentStep, activeTab: Used for UI interaction (tab view, step counter).
  // selectedFile: File opened in the code editor.
  // steps: Instructions to build files.
  // files: Virtual file tree generated based on steps.
  
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  // For handling live preview build progress (probably used with webcontainer).

  const [editedPaths, setEditedPaths] = useState<Set<string>>(new Set());
  // saved the edited paths.


  
  const handleSend = async () => {
    if (!userPrompt.trim()) return;
    // Prevents empty prompt submission.

    const newMessage = { role: 'user' as const, content: userPrompt };
    setLoading(true);
    setPrompt('');
    // Adds user's prompt to the chat, sets loading, and clears input field.

    const stepsResponse = await axios.post(`/api/chat`, {
      messages: [...llmMessages, newMessage],
    });
    // Calls backend to get assistant's response for the full chat history.
    setLoading(false);

    const parsedSteps = parseXml(stepsResponse.data.response).map((x) => ({
      ...x,
      status: 'pending' as const,
    }));
    // Parses the response from XML to structured steps. Each step is marked as "pending" for now.

    setLlmMessages((x) => [...x, newMessage, { role: 'assistant', content: stepsResponse.data.response }]);
    setSteps((s) => [...s, ...parsedSteps]);
    localStorage.setItem(`ai-steps-${prompt}`, JSON.stringify([...steps, ...parsedSteps]));
    // Updates message history, stores steps in localStorage.
  };

  const init = async () => {
    const response = await axios.post(`/api/template`, { prompt: prompt?.trim() });
    setTemplateSet(true);
    // Gets pre-prompt templates to pre-fill the chat.

    const { prompts, uiPrompts } = response.data;
    const parsedInitialSteps = parseXml(uiPrompts[0]).map((x: Step) => ({ ...x, status: 'pending' as const }));
    setSteps(parsedInitialSteps);
    // Parses initial UI prompt into structured steps.

    setLoading(true);
    const stepsResponse = await axios.post(`/api/chat`, {
      messages: [...prompts, prompt].map((p) => ({ role: 'user', parts: p })),
    });
    setLoading(false);
    // Sends full prompt + initial user instructions.

    const finalSteps = [
      ...parsedInitialSteps,
      ...parseXml(stepsResponse.data.response).map((x) => ({ ...x, status: 'pending' as const })),
    ];
    setSteps(finalSteps);
    // Combines UI and assistant-generated steps.
    

    setLlmMessages([
      ...prompts.map((p: string) => ({ role: 'user', content: p })),
      { role: 'user', content: prompt! },
      { role: 'assistant', content: stepsResponse.data.response },
    ]); // Saves conversation

    localStorage.setItem(`ai-steps-${prompt}`, JSON.stringify(finalSteps)); // Stores steps
    // localStorage.setItem(`ai-files-${prompt}`, JSON.stringify([])); // will update when files are built
  };

  useEffect(() => {
  if (hydratedRef.current) return;
  hydratedRef.current = true; // ✅ Move this to top

  const cachedSteps = localStorage.getItem(`ai-steps-${prompt}`);
  const cachedFiles = localStorage.getItem(`ai-files-${prompt}`);
  const selectedPath = localStorage.getItem(`ai-selected-${prompt}`);
  const isGenerated = localStorage.getItem(`ai-generated-${prompt}`) === 'true';
  const cachedEditedPaths = localStorage.getItem(`ai-edited-${prompt}`);

  if (cachedEditedPaths) {
    setEditedPaths(new Set(JSON.parse(cachedEditedPaths)));
  }

  if (cachedSteps && cachedFiles && isGenerated) {
    setSteps(JSON.parse(cachedSteps));
    const parsedFiles = JSON.parse(cachedFiles);
    setFiles(parsedFiles);
    setTemplateSet(true);

    if (selectedPath) {
      const findFile = (items: FileItem[]): FileItem | null => {
        for (const item of items) {
          if (item.path === selectedPath) return item;
          if (item.type === 'folder' && item.children) {
            const result = findFile(item.children);
            if (result) return result;
          }
        }
        return null;
      };
      const selected = findFile(parsedFiles);
      if (selected) setSelectedFile(selected);
      }
    } else {
      init();
    }
  }, [prompt]);

  useEffect(() => {
  const pendingSteps = steps.filter(({ status }) => status === 'pending');
  if (pendingSteps.length === 0) return;

  let originalFiles = [...files];
  let updateHappened = false;

  pendingSteps.forEach((step) => {
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
            // ✅ Only overwrite content if this file hasn't been manually edited
            if (!editedPaths.has(currentFolder)) {
              file.content = step.code;
            }
          }
        }
        else {
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

      // Store the generated result
      localStorage.setItem(`ai-files-${prompt}`, JSON.stringify(originalFiles));
      localStorage.setItem(`ai-generated-${prompt}`, 'true'); // ✅ Only set this now
    }
  }, [steps]);


  


  useEffect(() => { // Mount files into WebContainer
    // Recursively converts your internal file tree to a webcontainer.mount() compatible structure.
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

    // Mounts the files inside a virtual environment that supports previewing/running code.
    const mountStructure = createMountStructure(files);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);


  
  // 1) A recursive updater that returns a new file tree
  // Recursively updates one file’s content in the file tree based on its path.
  function updateFileContent(
    items: FileItem[],
    updated: FileItem
  ): FileItem[] {
    return items.map(item => {
      if (item.type === 'file' && item.path === updated.path) {
        // Replace the file node
        return { ...item, content: updated.content };
      } else if (item.type === 'folder' && item.children) {
        // Recurse into folders
        return {
          ...item,
          children: updateFileContent(item.children, updated),
        };
      }
      return item;
    });
  }
  
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

    
  const handleRegenerate = () => {
    localStorage.removeItem(`ai-files-${prompt}`);
    localStorage.removeItem(`ai-steps-${prompt}`);
    setSteps([]);
    setFiles([]);
    setTemplateSet(false);
    init();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="w-full bg-black border-b border-[#2c2c3a] px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-2xl tracking-tight">
          DevKit
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
                </>
              )}
            </div>
          </div>

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
              {activeTab === 'code' ? (
                <CodeEditor
                  file={selectedFile}
                  onFileChange={(updatedFile) => {
                    setFiles((oldFiles) => {
                      const updatedFiles = updateFileContent(oldFiles, updatedFile);
                      localStorage.setItem(`ai-files-${prompt}`, JSON.stringify(updatedFiles)); // Persist updated file content
                      return updatedFiles;
                    });

                    setSelectedFile(updatedFile);
                    localStorage.setItem(`ai-selected-${prompt}`, updatedFile.path);

                    // ✅ Track manually edited file paths
                    setEditedPaths((prev) => {
                      const updated = new Set(prev).add(updatedFile.path);
                      localStorage.setItem(`ai-edited-${prompt}`, JSON.stringify([...updated])); // Persist edited file paths
                      return updated;
                    });
                  }}
                />
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
                  {webcontainer && (
                    <PreviewFrame
                      webContainer={webcontainer}
                      files={files}
                      onProgressUpdate={setPreviewProgress}
                      onReady={() => {
                        setPreviewProgress(100);
                        setPreviewReady(true);
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}







/*
🔴 THE ORIGINAL PROBLEM
❓ What was happening:
You were updating file content in <CodeEditor />, and also saving it to localStorage.

But after the second refresh, the edited file content got reset to the original AI-generated version.

🧠 Why it happened:
The app re-applied the AI steps again after each refresh, and they overwrote your manual changes.

This happened because:

Your app re-parsed AI steps from localStorage or API.

It saw "pending" steps and re-ran them.

During this, it re-wrote all files based on step.code, ignoring your changes.

Your edits were saved in localStorage, but later overwritten by the regenerated steps.

✅ THE FIX (Logic Breakdown)
✅ Step 1: Track manually edited files
We introduced a new Set<string> called editedPaths, to store paths of files that the user modified manually.

✅ Step 2: Skip overwriting edited files
In the useEffect([steps]) that replays steps like "create file", we added:

js
Copy
Edit
if (!editedPaths.has(currentFolder)) {
  file.content = step.code; // Only update if not user-edited
}
So, when processing steps, we check:

“Was this file manually edited by the user?”
If yes, we skip overwriting it with AI-generated code.

✅ Step 3: Store editedPaths in localStorage
To make this persist across refreshes, we saved editedPaths to localStorage, just like you did with files and steps.

This ensures that:

Even after multiple refreshes

Your app knows which files were user-edited

And it respects that during step processing

✅ Summary of What Was Fixed
Problem	Fix
AI steps overwriting manual edits	Tracked edited file paths using editedPaths
Manual edits not surviving multiple reloads	Skipped applying AI-generated code to edited files
Changes lost after refresh	Used localStorage to persist both file contents & edit history

✅ Final Outcome
Now your app:

🧠 Loads previous data smartly.

🛠 Applies AI-generated steps only once.

🧾 Respects manual edits during future step reprocessing.

🔁 Fully survives unlimited refreshes without losing user work.

*/