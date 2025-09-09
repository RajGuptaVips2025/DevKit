"use client";

import React, { useEffect, useRef, useState } from 'react';
import { FileExplorer } from '../../components/FileExplorer';
import { CodeEditor } from '../../components/CodeEditor';
import { Step, FileItem, StepType } from '../types';
import { useWebContainer } from '../hooks/useWebContainer';
import { parseXml } from '../types/steps';
import axios from 'axios';
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
import { useRouter, useSearchParams, useParams } from 'next/navigation';

type BuilderProps = {
  id?: string;
};

export default function Builder({ id }: BuilderProps) {

  const hydratedRef = useRef(false);
  const searchParams = useSearchParams();
  const prompt = decodeURIComponent(searchParams.get('prompt') || '');
  const params = useParams();
  const effectiveId = id ?? params?.id ?? null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_llmMessages, setLlmMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_uiPrompts, setUiPrompt] = useState<string>("")
  const [builderpromptValue, setBuilderPromptValue] = useState<string>("");
  const { data: session } = useSession();
  const skipStepsUpdateRef = useRef(false);

  const {
    prompt: storePrompt,
    model: storeModel,
    framework: storeFramework,
    imageFile: storeImageFile,
  } = useBuildStore();
  const router = useRouter();

  const init = async () => {
    setLoading(true);

    try {
      const storedInit = typeof window !== 'undefined' ? sessionStorage.getItem('ai-prompt-init') : null;
      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('ai-prompt-token') : null;

      if ((!storePrompt || storePrompt.trim() === '') && !storeImageFile) {
        toast.error('Generation blocked: please use the input box and click Generate.', { duration: 4000 });
        router.push('/');
        return;
      }
      if (!storedInit || !storedToken) {
        toast.error('Generation blocked: please use the input box and click Generate.', { duration: 4000 });
        router.push('/');
        return;
      }

      const formData = new FormData();
      const promptValue = `${storePrompt?.trim() || ''} using ${storeFramework?.trim() || ''}`;
      formData.append('prompt', promptValue);
      if (storeImageFile) formData.append('image', storeImageFile as File);
      formData.append('model', storeModel);
      formData.append('framework', storeFramework);
      formData.append('email', session?.user?.email || '');

      const templateResponse = await axios.post('/api/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTemplateSet(true);
      const { prompts, uiPrompts, imageUrl } = templateResponse.data;
      const parsedInitialSteps = parseXml(uiPrompts[0]).map((x: Step) => ({ ...x, status: 'pending' as const }));
      setSteps(parsedInitialSteps);
      setUiPrompt(uiPrompts);

      formData.append('prompts', JSON.stringify(prompts));
      formData.append('uiprompt', uiPrompts);
      formData.append('framework', storeFramework?.trim() || '');

      const stepsResponse = await axios.post('/api/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (stepsResponse.data?.error && Object.keys(stepsResponse.data.error).length > 0) {
        throw { isApiError: true, ...stepsResponse.data.error };
      }

      const finalSteps = [
        ...parsedInitialSteps,
        ...parseXml(stepsResponse.data.response).map((x) => ({ ...x, status: 'pending' as const })),
      ];

      setSteps(finalSteps);
      setLlmMessages([
        ...prompts.map((p: string) => ({ role: 'user', content: p })),
        { role: 'user', content: storePrompt! },
        { role: 'assistant', content: stepsResponse.data.response },
      ]);
      setActiveTab('preview');

      const saveResponse = await axios.post('/api/generation', {
        prompt: storePrompt?.trim(),
        modelName: storeModel,
        steps: finalSteps,
        framework: storeFramework,
        output: stepsResponse.data.response,
        files: files.length > 0 ? files : undefined,
        imageUrl,
        email: session?.user?.email,
        source: 'ui',
      });

      const generationId = saveResponse.data?.generation?._id;
      if (!generationId) throw new Error('Generation ID missing');

      setGetDbId(generationId);
      window.history.replaceState(null, "", `/builder/${generationId}`);
      sessionStorage.removeItem('ai-prompt-init');
      localStorage.removeItem('ai-prompt-entered');
      localStorage.setItem('lastPromptTime', Date.now().toString());
    }
    catch (error: any) {
      console.error("❌ Caught error in init():", error);

      const status = error?.status || error?.response?.status || null;

      if (status) {
        switch (status) {
          case 400:
            alert("Bad request. Please check your input and try again.");
            router.push("/");
            break;
          case 401:
            alert("Unauthorized. Please check your API key or login session.");
            router.push("/");
            break;
          case 403:
            alert("Access denied. You don’t have permission to use this model. Try again later or use a different model.");
            router.push("/");
            break;
          case 404:
            alert("Requested model or resource not found. It may be unavailable. Try again later or use a different model.");
            router.push("/");
            break;
          case 429:
            alert("Output Quota exceeded. Try again later or use a different model.");
            router.push("/");
            break;
          case 500:
          case 503:
            alert("API servers are overloaded. Try again later or use a different model.");
            router.push("/");
            break;
          default:
            alert("An unexpected error occurred. Try again later or use a different model.");
            router.push("/");
            break;
        }
      } else if (error?.isApiError) {
        alert(error.message || "API error occurred.");
        router.push("/");
      } else {
        alert("An unknown error occurred. Please check your connection.");
        router.push("/");
      }
    }
    finally {
      setLoading(false);
    }
  };

  const fromDB = async () => {
    try {
      const res = await axios.get(`/api/generation/${effectiveId}`);
      const data = res.data;

      if (data.generation.files?.length > 0) {
        setFiles(data.generation.files);
        setTemplateSet(true);
        setBuilderPromptValue(data.generation.prompt);
      }

      if (data.generation.steps) {
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
      init();
    }
  };

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const checkLimit = async () => {
      try {
        if (effectiveId) {
          skipStepsUpdateRef.current = true;
          fromDB();
        } else {
          init();
        }
      } catch (error: any) {
        router.push("/");
        toast.error("❌ Something went wrong with prompt generation.", error);
      }
    };
    checkLimit();
  }, [prompt, effectiveId]);


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
      }
    };
    runStepsUpdate();
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
    const mountStructure = createMountStructure(files);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);



  function updateFileContent(
    items: FileItem[],
    updated: FileItem
  ): FileItem[] {
    return items.map(item => {
      if (item.type === 'file' && item.path === updated.path) {
        return { ...item, content: updated.content };
      } else if (item.type === 'folder' && item.children) {
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


  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 4000;

  const handleCodeChange = (updatedFile: FileItem) => {
    if (files.length === 0) {
      console.warn("⚠️ Skipping PATCH because file tree is empty");
      return;
    }

    const updated = updateFileContent(files, updatedFile);
    setFiles(updated);

    setEditedPaths(prev => {
      const newSet = new Set(prev);
      newSet.add(updatedFile.path);
      return newSet;
    });

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const generationId = getDbId || effectiveId;
      if (!generationId) {
        console.warn("⚠️ No generationId found, skipping backend sync");
        return;
      }

      try {
        await axios.patch(`/api/generation/${generationId}`, {
          files: updated,
        });
      } catch (err) {
        console.error("❌ Failed to update code in DB", err);
      }
    }, DEBOUNCE_DELAY);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="w-full bg-black border-b border-[#2c2c3a] px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-2xl tracking-tight">DevKit</Link>
      </div>

      <div className="px-4">
        <p
          className="text-sm text-white mt-1 italic cursor-help"
          title={!effectiveId ? storePrompt : builderpromptValue} // show full text on hover
        >
          Prompt: {
            (!effectiveId ? storePrompt : builderpromptValue).length > 25
              ? (!effectiveId ? storePrompt : builderpromptValue).slice(0, 25) + "..."
              : (!effectiveId ? storePrompt : builderpromptValue)
          }
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex gap-2 p-2 h-[calc(100vh-8rem)]">
        <div className="w-[20%] bg-[#1a1a1d] rounded-xl p-4 shadow-inner border border-[#2c2c3a] flex flex-col overflow-auto">
          <h2 className="text-lg font-semibold text-white mb-2">🧠 Steps</h2>
          <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
          <div className="space-y-2">
            {loading || !templateSet ? <Loader /> : ""}
          </div>
        </div>

        {/* File Explorer - 20% width */}
        <div className="w-[20%] bg-[#1a1a1d] rounded-xl p-2 text-white border border-[#2c2c3a] shadow-md overflow-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-md -tracking-tighte font-semibold">📁 File Explorer</h2>
            <Button
              onClick={!loading ? handleExportZip : undefined}
              className={`group relative flex items-center gap-2
                ${loading ? "opacity-50 cursor-not-allowed pointer-events-auto" : ""}`}
            >
              Export ZIP
            </Button>
          </div>
          <FileExplorer onTabChange={setActiveTab} files={files} onFileSelect={setSelectedFile} loading={loading} />
        </div>

        {/* Code / Preview - 60% width */}
        <div className="w-[60%] rounded-xl p-2 h-full border border-[#2c2c3a] bg-[#1a1a1d] shadow-xl flex flex-col">
          <TabView
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (!loading || tab !== 'preview') {
                setActiveTab(tab);
              }
            }}
            loading={loading}
            showStepsOnMobile={false}
          />
          <div className="flex-1 mt-2 bg-black rounded-lg overflow-auto p-3 border border-[#2a2a3d]">
            <div style={{ display: activeTab === 'code' ? 'block' : 'none', height: '100%' }}>
              <CodeEditor
                file={selectedFile}
                onFileChange={(updatedFile) => {
                  handleCodeChange(updatedFile);
                  setSelectedFile(updatedFile);
                }}
              />
            </div>
            <div style={{ display: activeTab === 'preview' ? 'block' : 'none', height: '100%' }}>
              {!previewReady && (
                <div className="mb-2 text-sm text-white">
                  Installing dependencies... {previewProgress}%
                  <div className="w-full h-2 bg-gray-700 rounded mt-1">
                    <div className="h-2 bg-green-500 rounded" style={{ width: `${previewProgress}%` }} />
                  </div>
                </div>
              )}
              {webcontainer && (
                <PreviewFrame
                  framework={storeFramework}
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
          <TabView activeTab={activeTab} onTabChange={setActiveTab} showStepsOnMobile={false} />

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
                loading={loading}
              />
            )}

            {activeTab === 'code' && (
              <CodeEditor
                file={selectedFile}
                onFileChange={(updatedFile) => {
                  handleCodeChange(updatedFile);
                  setSelectedFile(updatedFile);
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
                    framework={storeFramework}
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