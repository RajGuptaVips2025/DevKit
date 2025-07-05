import React, { useEffect, useRef, useState } from 'react';
import { FileItem } from '../app/types';
import { Editor, OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  file: FileItem | null;
  onFileChange?: (updated: FileItem) => void;
}

export function CodeEditor({ file, onFileChange  }: CodeEditorProps) {

  const [content, setContent] = useState<string>(file?.content || '');
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (file) setContent(file.content || '');
  }, [file?.path]); // ✅ Only update if a different file is selected

  // Capture the Monaco editor instance
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  // Track changes, update local state, and notify parent
  const handleChange = (value: string | undefined) => {
    if (value === undefined) return;
    setContent(value);
    if (file && onFileChange) {
      onFileChange({ ...file, content: value });
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 bg-black">
        Select a file to view its contents
      </div>
    );
  }

  return (
    
    <Editor
    height="100%"
      defaultLanguage={file.name.endsWith('.ts') || file.name.endsWith('.tsx') ? 'typescript' : 'plaintext'}
      theme="vs-dark"
      value={content}
      onMount={handleEditorDidMount}
      onChange={handleChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
      }}
    />
  );
}
