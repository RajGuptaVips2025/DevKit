// lib/store.ts
import { create } from 'zustand';

interface BuildState {
  prompt: string;
  model: string;
  imageFile: File | null;
  setPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setImageFile: (file: File | null) => void;
}

export const useBuildStore = create<BuildState>((set) => ({
  prompt: '',
  model: 'gemini-2.5-pro', // Your default model
  imageFile: null,
  setPrompt: (prompt) => set({ prompt }),
  setModel: (model) => set({ model }),
  setImageFile: (file) => set({ imageFile: file }),
}));