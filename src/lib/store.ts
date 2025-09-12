import { create } from 'zustand';

interface BuildState {
  prompt: string;
  model: string;
  framework: 'react' | 'angular'; // 👈 added framework
  imageFile: File | null;
  isCooldown: boolean;
  cooldownTime: number;
  setPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setFramework: (framework: 'react' | 'angular') => void; // 👈 setter
  setImageFile: (file: File | null) => void;
  startCooldown: (seconds: number) => void;
}

let cooldownInterval: NodeJS.Timeout | null = null;

export const useBuildStore = create<BuildState>((set) => {
  const startCooldown = (seconds: number) => {
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }

    const endTime = Date.now() + seconds * 1000;

    set({ isCooldown: true, cooldownTime: seconds });

    cooldownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        if (cooldownInterval) {
          clearInterval(cooldownInterval);
          cooldownInterval = null;
        }
        set({ isCooldown: false, cooldownTime: 0 });
        // localStorage.removeItem("cooldownEndTime");
      } else {
        set({ cooldownTime: remaining });
      }
    }, 1000);
  };

  return {
    prompt: '',
    framework: 'react', 
    model: 'gemini-2.5-flash',
    imageFile: null,
    isCooldown: false,
    cooldownTime: 0,
    setPrompt: (prompt) => set({ prompt }),
    setModel: (model) => set({ model }),
    setFramework: (framework) => set({ framework }),
    setImageFile: (file) => set({ imageFile: file }),
    startCooldown,
  };
});