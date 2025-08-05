// lib/store.ts
import { create } from 'zustand';

interface BuildState {
  prompt: string;
  model: string;
  imageFile: File | null;
  isCooldown: boolean;
  cooldownTime: number;
  setPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setImageFile: (file: File | null) => void;
  startCooldown: (seconds: number) => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  prompt: '',
  model: 'gemini-2.5-pro',
  imageFile: null,
  isCooldown: false,
  cooldownTime: 0,

  setPrompt: (prompt) => set({ prompt }),
  setModel: (model) => set({ model }),
  setImageFile: (file) => set({ imageFile: file }),

  startCooldown: (seconds: number) => {
    set({ isCooldown: true, cooldownTime: seconds });

    const interval = setInterval(() => {
      const { cooldownTime } = get();
      if (cooldownTime <= 1) {
        clearInterval(interval);
        set({ isCooldown: false, cooldownTime: 0 });
      } else {
        set({ cooldownTime: cooldownTime - 1 });
      }
    }, 1000);
  },
}));