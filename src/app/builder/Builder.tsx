"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FileExplorer } from '../../components/FileExplorer';
import { CodeEditor } from '../../components/CodeEditor';
import { Step, FileItem, StepType } from '../types';
import { useWebContainer } from '../hooks/useWebContainer';
import { parseXml } from '../types/steps';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StepsList } from '@/components/StepsList';
import { Loader } from '@/components/Loader';
import { TabView } from '@/components/TabView';
import { PreviewFrame } from '@/components/PreviewFrame';
import Link from 'next/link';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { injectRuntimeErrorHandler } from '../utils/injectRuntimeErrorHandler';
import { useSession } from "next-auth/react";
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useBuildStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function Builder() {

  const hydratedRef = useRef(false);
  const searchParams = useSearchParams();
  const prompt = decodeURIComponent(searchParams.get('prompt') || '');
  const framework = decodeURIComponent(searchParams.get('framework') || '');
  const modelParam = searchParams.get("model") || "gemini-2.5-flash-preview-05-20";
  const id = searchParams.get("id");
  const [userPrompt, setPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'files' | 'steps' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [editedPaths, setEditedPaths] = useState<Set<string>>(new Set());
  const [getDbId, setGetDbId] = useState<string>("")
  const [uiPrompts, setUiPrompt] = useState<string>("")
  const { data: session } = useSession();
  const skipStepsUpdateRef = useRef(false);
  const { model, imageFile } = useBuildStore.getState(); // Get data from store
  const router = useRouter();
  const handleSendMessage = async () => {
    const newMessage = { role: 'user' as const, content: userPrompt };
    setLoading(true);
    setPrompt('');

    try {
      const formData = new FormData();
      formData.append("prompt", userPrompt);
      formData.append("prompts", JSON.stringify(llmMessages));
      formData.append("uiprompt", uiPrompts);
      formData.append("model", model);
      // if (files) formData.append("image", files); // if sending image

      const stepsResponse = await axios.post(`/api/chat`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // const stepsResponse = await axios.post(`/api/chat`, {
      //   messages: [...llmMessages, newMessage],
      //   model: modelParam,
      // });

      const assistantMessage = {
        role: 'assistant' as const,
        content: stepsResponse.data.response,
      };

      setLlmMessages((prev) => [...prev, newMessage]);
      setLlmMessages((prev) => [...prev, assistantMessage]);

      const parsedSteps = parseXml(stepsResponse.data.response).map((step) => ({
        ...step,
        status: 'pending' as const,
      }));

      setSteps((prevSteps) => [...prevSteps, ...parsedSteps]);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const init = async () => {
    const formData = new FormData();
    // formData.append('prompt', prompt?.trim() || '');
    formData.append('prompt', `${prompt?.trim() || ''} using ${framework?.trim() || ''}`);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    formData.append('model', model);
    formData.append('framework', framework);

    const templateResponse = await axios.post(`/api/template`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setTemplateSet(true);
    const { prompts, uiPrompts, imageUrl } = templateResponse.data;
    const parsedInitialSteps = parseXml(uiPrompts[0]).map((x: Step) => ({ ...x, status: 'pending' as const }));
    setSteps(parsedInitialSteps);
    setUiPrompt(uiPrompts)
    setLoading(true);
    formData.append("prompts", JSON.stringify(prompts)); // ← exact same data
    formData.append("uiprompt", uiPrompts); // ← new prompt
    formData.append('framework', framework?.trim() || '');

    const stepsResponse = await axios.post(`/api/chat`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setLoading(false);

    const finalSteps = [
      ...parsedInitialSteps,
      ...parseXml(stepsResponse.data.response).map((x) => ({ ...x, status: 'pending' as const })),
    ];
    setSteps(finalSteps);


    setLlmMessages([
      ...prompts.map((p: string) => ({ role: 'user', content: p })),
      { role: 'user', content: prompt! },
      { role: 'assistant', content: stepsResponse.data.response },
    ]); // Saves conversation
    setActiveTab('preview')

    localStorage.setItem(`ai-steps-${prompt}`, JSON.stringify(finalSteps)); // Stores steps
    const saveResponse = await axios.post("/api/generation", {
      prompt: prompt?.trim(),
      modelName: model,
      steps: finalSteps,
      output: stepsResponse.data.response,
      files,
      imageUrl,
      framework: framework,
      email: session?.user?.email, // manually pass email
    });
    const generationId = saveResponse.data.generation._id;
    setGetDbId(saveResponse.data.generation._id)
    localStorage.setItem(`ai-generation-id-${prompt}`, generationId);
    // localStorage.setItem(`ai-files-${prompt}`, JSON.stringify([])); // will update when files are built
  };


  const fromDB = async () => {
    try {
      const res = await axios.get(`/api/generation/${id}`);
      const data = res.data;

      if (data.generation.files) {
        setFiles(data.generation.files);
        setTemplateSet(true);
      }

      if (data.generation.steps) {
        localStorage.setItem(`ai-steps-${data.generation.prompt}`, JSON.stringify(data.generation.steps));
        localStorage.setItem(`ai-generation-id-${data.generation.prompt}`, data.generation._id);
        setSteps(
          data.generation.steps.map((s: any) => ({
            ...s,
            status: 'completed',
          }))
        );
      }

      if (data.editedPaths) {
        setEditedPaths(new Set(data.editedPaths));
      }
      if (data.selectedPath) {
        // ✅ Explicitly typed recursive function
        const findFile = (items: FileItem[]): FileItem | null => {
          for (const item of items) {
            if (item.path === data.selectedPath) return item;
            if (item.type === 'folder' && item.children) {
              const result: FileItem | null = findFile(item.children);
              if (result) return result;
            }
          }
          return null;
        };

        const selected: FileItem | null = findFile(data.files);
        if (selected) setSelectedFile(selected);
      }
    }
    catch (err) {
      console.error("❌ Failed to fetch from DB:", err);
      init(); // fallback if DB call fails
    }
  };

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const checkLimit = async () => {
      try {
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
          const parsedFiles: FileItem[] = JSON.parse(cachedFiles);
          setFiles(parsedFiles);
          setTemplateSet(true);

          if (selectedPath) {
            const findFile = (items: FileItem[]): FileItem | null => {
              for (const item of items) {
                if (item.path === selectedPath) return item;
                if (item.type === "folder" && item.children) {
                  const result = findFile(item.children);
                  if (result) return result;
                }
              }
              return null;
            };

            const selected = findFile(parsedFiles);
            if (selected) setSelectedFile(selected);
          }
        }
        else if (id) {
          skipStepsUpdateRef.current = true;
          fromDB(); // ✅ call your DB fallback
        }
        else {
          const response = await axios.post("/api/check-limit", {
            email: session?.user?.email, // or userId
          });

          const { limitReached } = response.data;

          if (limitReached) {
            toast.error("❌ You’ve reached your daily limit of 5 prompts.");
            router.push("/"); // ⛔ redirect if over limit
            return;
          }

          init(); // 🧪 fresh generation
        }
      } catch (error: any) {
        router.push("/"); // ⛔ redirect if over limit
        toast.error("❌ You’ve reached your daily limit of 5 prompts.");

      }
    };
    checkLimit();
  }, [prompt, id]);

  useEffect(() => {
    if (skipStepsUpdateRef.current) return;

    const runStepsUpdate = async () => {
      const pendingSteps = steps.filter(({ status }) => status === 'pending');
      if (pendingSteps.length === 0) return;

      let originalFiles = [...files];
      let updateHappened = false;

      pendingSteps.forEach((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? [];
          let currentFileStructure = [...originalFiles];
          const finalAnswerRef = currentFileStructure;
          let currentFolder = '';

          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            const currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              const file = currentFileStructure.find((x) => x.path === currentFolder);
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                if (!editedPaths.has(currentFolder)) {
                  file.content = step.code;
                }
              }
            } else {
              const folder = currentFileStructure.find((x) => x.path === currentFolder);
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
        const injectedFiles = injectRuntimeErrorHandler(originalFiles);

        setFiles(injectedFiles);
        setSteps((steps) =>
          steps.map((s) => ({
            ...s,
            status: 'completed',
          }))
        );



        localStorage.setItem(`ai-files-${prompt}`, JSON.stringify(injectedFiles));
        localStorage.setItem(`ai-generated-${prompt}`, 'true');
      }
    };

    runStepsUpdate(); // ✅ Call the async function

  }, [steps]);

  useEffect(() => {
    const runfun = async () => {

      if (getDbId) {
        try {
          await axios.patch(`/api/generation/${getDbId}`, {
            files: files,
          });
        } catch (err) {
          console.error("❌ Failed to update code in DB", err);
        }
      }
    }
    runfun()
  }, [getDbId])


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

  const handleCodeChange = async (updatedFile: FileItem) => {

    // 1. Update file in state
    const updated = updateFileContent(files, updatedFile);
    setFiles(updated);

    // 2. Update edited paths
    setEditedPaths((prev) => {
      const newSet = new Set(prev);
      newSet.add(updatedFile.path);
      localStorage.setItem(`ai-edited-${prompt}`, JSON.stringify([...newSet]));
      return newSet;
    });

    // 3. Store updated files in localStorage
    localStorage.setItem(`ai-files-${prompt}`, JSON.stringify(updated));

    // 4. Update backend with full file tree, including all file properties
    const generationId = localStorage.getItem(`ai-generation-id-${prompt}`);

    if (!generationId) return;

    try {
      await axios.patch(`/api/generation/${generationId}`, {
        files: updated,  // send the full updated file tree (with name, path, type, content, children if folder)
      });
    } catch (err) {
      console.error("❌ Failed to update code in DB", err);
    }
  };

  if (!prompt) {
    return (
      <div className="text-white text-center p-4">
        No prompt provided in URL. Please use <code>?prompt=your_text</code> in the address bar.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="w-full bg-black border-b border-[#2c2c3a] px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-2xl tracking-tight">DevKit</Link>
        <button
          className="text-white hover:bg-[#2a2a3d] p-2 rounded"
        // onClick={() => localStorage.clear()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="px-4">
        <p className="text-sm text-white mt-1 italic">Prompt: {prompt}</p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-2 p-2 h-[calc(100vh-8rem)]">
        <div className="col-span-2 bg-[#1a1a1d] rounded-xl p-1 shadow-inner border border-[#2c2c3a] flex flex-col overflow-auto">
          <h2 className="text-lg font-semibold text-white">🧠 Steps</h2>
          <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
          <div className=" space-y-2">
            <h3 className="text-xs text-gray-400 uppercase mb-1">AI Assistant</h3>
            {loading || !templateSet ? (
              <Loader />
            ) : (
              <div className="flex space-x-2 items-center mt-2">
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What do you want to build?"
                  className="flex-1 bg-[#2a2a3d] text-white border border-[#3b3b4f] placeholder:text-gray-500 resize-none"
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 bg-[#1a1a1d] rounded-xl p-2 text-white border border-[#2c2c3a] shadow-md overflow-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-1  ">
            <h2 className="text-md -tracking-tighte font-semibold">📁 File Explorer</h2>
            <Button size='sm' onClick={handleExportZip}>Export ZIP</Button>
          </div>
          <FileExplorer onTabChange={setActiveTab} files={files} onFileSelect={setSelectedFile} />
        </div>

        <div className="col-span-8 rounded-xl p-2 h-full border border-[#2c2c3a] bg-[#1a1a1d] shadow-xl flex flex-col ">
          <TabView activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 mt-2 bg-black rounded-lg overflow-auto p-3 border border-[#2a2a3d]">
            {/* Code editor (hidden when not active) */}
            <div style={{ display: activeTab === 'code' ? 'block' : 'none', height: '100%' }}>
              <CodeEditor
                file={selectedFile}
                onFileChange={(updatedFile) => {
                  handleCodeChange(updatedFile);
                  setSelectedFile(updatedFile);
                  localStorage.setItem(`ai-selected-${prompt}`, updatedFile.path);
                }}
              />
            </div>

            <div style={{ display: activeTab === 'preview' ? 'block' : 'none', height: '100%' }}>
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
                  framework={framework}
                  webContainer={webcontainer}
                  files={files}
                  onProgressUpdate={setPreviewProgress}
                  onReady={() => {
                    setPreviewProgress(100);
                    setPreviewReady(true);
                  }}
                  activeTab={activeTab}
                />
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Tab Layout */}
      <div className="block md:hidden p-2 h-[calc(100vh-8rem)]">
        <div className="rounded-xl p-4 h-full border border-[#2c2c3a] bg-[#1a1a1d] shadow-xl flex flex-col">
          <TabView activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex-1 mt-2 bg-black rounded-lg overflow-auto p-3 border border-[#2a2a3d]">
            {activeTab === 'steps' && (
              <>
                <h2 className="text-lg font-semibold mb-4 text-gray-100">Build Steps</h2>
                {steps?.map((step, index) => (
                  <div
                    key={index}
                    className={`p-1 rounded-lg cursor-pointer transition-colors ${currentStep === step.id
                      ? 'bg-gray-800 border border-gray-700'
                      : 'hover:bg-gray-800'
                      }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div className="flex items-center gap-2">
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : step.status === 'in-progress' ? (
                        <Clock className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-600" />
                      )}
                      <h3 className="font-medium text-gray-100">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{step.description}</p>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'files' && (
              <FileExplorer
                files={files}
                onFileSelect={(file) => {
                  setSelectedFile(file);
                  setActiveTab('code');
                }}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'code' && (
              <CodeEditor
                file={selectedFile}
                onFileChange={(updatedFile) => {
                  handleCodeChange(updatedFile);
                  setSelectedFile(updatedFile);
                  localStorage.setItem(`ai-selected-${prompt}`, updatedFile.path);
                }}
              />
            )}

            {activeTab === 'preview' && (
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
                    framework={framework}
                    webContainer={webcontainer}
                    files={files}
                    onProgressUpdate={setPreviewProgress}
                    onReady={() => {
                      setPreviewProgress(100);
                      setPreviewReady(true);
                    }}
                    activeTab={activeTab}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}