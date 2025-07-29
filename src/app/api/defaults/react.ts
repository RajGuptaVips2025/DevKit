
export const basePrompt = `<boltArtifact id=\"project-import\" title=\"Project Files\"><boltAction type=\"file\" filePath=\"eslint.config.js\">import js from '@eslint/js';\nimport globals from 'globals';\nimport reactHooks from 'eslint-plugin-react-hooks';\nimport reactRefresh from 'eslint-plugin-react-refresh';\nimport tseslint from 'typescript-eslint';\n\nexport default tseslint.config(\n  { ignores: ['dist'] },\n  {\n    extends: [js.configs.recommended, ...tseslint.configs.recommended],\n    files: ['**/*.{ts,tsx}'],\n    languageOptions: {\n      ecmaVersion: 2020,\n      globals: globals.browser,\n    },\n    plugins: {\n      'react-hooks': reactHooks,\n      'react-refresh': reactRefresh,\n    },\n    rules: {\n      ...reactHooks.configs.recommended.rules,\n      'react-refresh/only-export-components': [\n        'warn',\n        { allowConstantExport: true },\n      ],\n    },\n  }\n);\n</boltAction><boltAction type=\"file\" filePath=\"index.html\"><!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n</boltAction><boltAction type=\"file\" filePath=\"package.json\">{\n  \"name\": \"vite-react-typescript-starter\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"lint\": \"eslint .\",\n    \"preview\": \"vite preview\"\n  },\n  \"dependencies\": {\n    \"lucide-react\": \"^0.344.0\",\n    \"react\": \"^18.3.1\",\n    \"react-dom\": \"^18.3.1\"\n  },\n  \"devDependencies\": {\n    \"@eslint/js\": \"^9.9.1\",\n    \"@types/react\": \"^18.3.5\",\n    \"@types/react-dom\": \"^18.3.0\",\n    \"@vitejs/plugin-react\": \"^4.3.1\",\n    \"autoprefixer\": \"^10.4.18\",\n    \"eslint\": \"^9.9.1\",\n    \"eslint-plugin-react-hooks\": \"^5.1.0-rc.0\",\n    \"eslint-plugin-react-refresh\": \"^0.4.11\",\n    \"globals\": \"^15.9.0\",\n    \"postcss\": \"^8.4.35\",\n    \"tailwindcss\": \"^3.4.1\",\n    \"typescript\": \"^5.5.3\",\n    \"typescript-eslint\": \"^8.3.0\",\n    \"vite\": \"^5.4.2\"\n  }\n}\n</boltAction><boltAction type=\"file\" filePath=\"postcss.config.js\">export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n</boltAction><boltAction type=\"file\" filePath=\"tailwind.config.js\">/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n</boltAction><boltAction type=\"file\" filePath=\"tsconfig.app.json\">{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"useDefineForClassFields\": true,\n    \"lib\": [\"ES2020\", \"DOM\", \"DOM.Iterable\"],\n    \"module\": \"ESNext\",\n    \"skipLibCheck\": true,\n\n    /* Bundler mode */\n    \"moduleResolution\": \"bundler\",\n    \"allowImportingTsExtensions\": true,\n    \"isolatedModules\": true,\n    \"moduleDetection\": \"force\",\n    \"noEmit\": true,\n    \"jsx\": \"react-jsx\",\n\n    /* Linting */\n    \"strict\": true,\n    \"noUnusedLocals\": true,\n    \"noUnusedParameters\": true,\n    \"noFallthroughCasesInSwitch\": true\n  },\n  \"include\": [\"src\"]\n}\n</boltAction><boltAction type=\"file\" filePath=\"tsconfig.json\">{\n  \"files\": [],\n  \"references\": [\n    { \"path\": \"./tsconfig.app.json\" },\n    { \"path\": \"./tsconfig.node.json\" }\n  ]\n}\n</boltAction><boltAction type=\"file\" filePath=\"tsconfig.node.json\">{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"lib\": [\"ES2023\"],\n    \"module\": \"ESNext\",\n    \"skipLibCheck\": true,\n\n    /* Bundler mode */\n    \"moduleResolution\": \"bundler\",\n    \"allowImportingTsExtensions\": true,\n    \"isolatedModules\": true,\n    \"moduleDetection\": \"force\",\n    \"noEmit\": true,\n\n    /* Linting */\n    \"strict\": true,\n    \"noUnusedLocals\": true,\n    \"noUnusedParameters\": true,\n    \"noFallthroughCasesInSwitch\": true\n  },\n  \"include\": [\"vite.config.ts\"]\n}\n</boltAction><boltAction type=\"file\" filePath=\"vite.config.ts\">import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n  optimizeDeps: {\n    exclude: ['lucide-react'],\n  },\n});\n</boltAction><boltAction type=\"file\" filePath=\"src/App.tsx\">import React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen bg-gray-100 flex items-center justify-center\">\n      <p>Start prompting (or editing) to see magic happen :)</p>\n    </div>\n  );\n}\n\nexport default App;\n</boltAction><boltAction type=\"file\" filePath=\"src/index.css\">@tailwind base;\n@tailwind components;\n@tailwind utilities;\n</boltAction><boltAction type=\"file\" filePath=\"src/main.tsx\">import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.tsx';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n</boltAction><boltAction type=\"file\" filePath=\"src/vite-env.d.ts\">/// <reference types=\"vite/client\" />\n</boltAction></boltArtifact>`






// export const basePrompt = `<boltArtifact id=\"project-import\" title=\"Project Files\"><boltAction type=\"file\" filePath=\"eslint.config.js\">import js from '@eslint/js';\nimport globals from 'globals';\nimport reactHooks from 'eslint-plugin-react-hooks';\nimport reactRefresh from 'eslint-plugin-react-refresh';\nimport tseslint from 'typescript-eslint';\n\nexport default tseslint.config(\n  { ignores: ['dist'] },\n  {\n    extends: [js.configs.recommended, ...tseslint.configs.recommended],\n    files: ['**/*.{ts,tsx}'],\n    languageOptions: {\n      ecmaVersion: 2020,\n      globals: globals.browser,\n    },\n    plugins: {\n      'react-hooks': reactHooks,\n      'react-refresh': reactRefresh,\n    },\n    rules: {\n      ...reactHooks.configs.recommended.rules,\n      'react-refresh/only-export-components': [\n        'warn',\n        { allowConstantExport: true },\n      ],\n    },\n  }\n);\n</boltAction><boltAction type=\"file\" filePath=\"index.html\"><!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>\n</boltAction><boltAction type=\"file\" filePath=\"package.json\">{\n  \"name\": \"vite-react-typescript-starter\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"lint\": \"eslint .\",\n    \"preview\": \"vite preview\"\n  },\n  \"dependencies\": {\n    \"lucide-react\": \"^0.344.0\",\n    \"react\": \"^18.3.1\",\n    \"react-dom\": \"^18.3.1\"\n  },\n  \"devDependencies\": {\n    \"@eslint/js\": \"^9.9.1\",\n    \"@types/react\": \"^18.3.5\",\n    \"@types/react-dom\": \"^18.3.0\",\n    \"@vitejs/plugin-react\": \"^4.3.1\",\n    \"autoprefixer\": \"^10.4.18\",\n    \"eslint\": \"^9.9.1\",\n    \"eslint-plugin-react-hooks\": \"^5.1.0-rc.0\",\n    \"eslint-plugin-react-refresh\": \"^0.4.11\",\n    \"globals\": \"^15.9.0\",\n    \"postcss\": \"^8.4.35\",\n    \"tailwindcss\": \"^3.4.1\",\n    \"typescript\": \"^5.5.3\",\n    \"typescript-eslint\": \"^8.3.0\",\n    \"vite\": \"^5.4.2\"\n  }\n}\n</boltAction><boltAction type=\"file\" filePath=\"postcss.config.js\">export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n</boltAction><boltAction type=\"file\" filePath=\"tailwind.config.js\">/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n</boltAction><boltAction type=\"file\" filePath=\"tsconfig.app.json\">{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"useDefineForClassFields\": true,\n    \"lib\": [\"ES2020\", \"DOM\", \"DOM.Iterable\"],\n    \"module\": \"ESNext\",\n    \"skipLibCheck\": true,\n\n    /* Bundler mode */\n    \"moduleResolution\": \"bundler\",\n    \"allowImportingTsExtensions\": true,\n    \"isolatedModules\": true,\n    \"moduleDetection\": \"force\",\n    \"noEmit\": true,\n    \"jsx\": \"react-jsx\",\n\n    /* Linting */\n    \"strict\": true,\n    \"noUnusedLocals\": true,\n    \"noUnusedParameters\": true,\n    \"noFallthroughCasesInSwitch\": true\n  },\n  \"include\": [\"src\"]\n}\n</boltAction><boltAction type=\"file\" filePath=\"tsconfig.json\">{\n  \"files\": [],\n  \"references\": [\n    { \"path\": \"./tsconfig.app.json\" },\n    { \"path\": \"./tsconfig.node.json\" }\n  ]\n}\n</boltAction><boltAction type=\"file\" filePath=\"tsconfig.node.json\">{\n  \"compilerOptions\": {\n    \"target\": \"ES2022\",\n    \"lib\": [\"ES2023\"],\n    \"module\": \"ESNext\",\n    \"skipLibCheck\": true,\n\n    /* Bundler mode */\n    \"moduleResolution\": \"bundler\",\n    \"allowImportingTsExtensions\": true,\n    \"isolatedModules\": true,\n    \"moduleDetection\": \"force\",\n    \"noEmit\": true,\n\n    /* Linting */\n    \"strict\": true,\n    \"noUnusedLocals\": true,\n    \"noUnusedParameters\": true,\n    \"noFallthroughCasesInSwitch\": true\n  },\n  \"include\": [\"vite.config.ts\"]\n}\n</boltAction><boltAction type=\"file\" filePath=\"vite.config.ts\">import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n  optimizeDeps: {\n    exclude: ['lucide-react'],\n  },\n});\n</boltAction><boltAction type=\"file\" filePath=\"src/App.tsx\">import React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen bg-gray-100 flex items-center justify-center\">\n      <p>Start prompting (or editing) to see magic happen :)</p>\n    </div>\n  );\n}\n\nexport default App;\n</boltAction><boltAction type=\"file\" filePath=\"src/index.css\">@tailwind base;\n@tailwind components;\n@tailwind utilities;\n</boltAction><boltAction type=\"file\" filePath=\"src/main.tsx\">import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.tsx';\nimport './index.css';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n</boltAction><boltAction type=\"file\" filePath=\"src/vite-env.d.ts\">/// <reference types=\"vite/client\" />\n</boltAction></boltArtifact>`







// export const basePrompt = `<boltArtifact id="project-import" title="Project Files">
//   <boltAction type="file" filePath="eslint.config.js">import js from '@eslint/js';
// import globals from 'globals';
// import reactHooks from 'eslint-plugin-react-hooks';
// import reactRefresh from 'eslint-plugin-react-refresh';
// import tseslint from 'typescript-eslint';

// export default tseslint.config(
//   { ignores: ['dist'] },
//   {
//     extends: [js.configs.recommended, ...tseslint.configs.recommended],
//     files: ['**/*.{ts,tsx}'],
//     languageOptions: {
//       ecmaVersion: 2020,
//       globals: globals.browser,
//     },
//     plugins: {
//       'react-hooks': reactHooks,
//       'react-refresh': reactRefresh,
//     },
//     rules: {
//       ...reactHooks.configs.recommended.rules,
//       'react-refresh/only-export-components': [
//         'warn',
//         { allowConstantExport: true },
//       ],
//     },
//   }
// );

// </boltAction>
// <boltAction type="file" filePath="package.json">{
//   "name": "nextjs-tailwind-starter",
//   "version": "0.0.1",
//   "private": true,
//   "scripts": {
//     "dev": "next dev",
//     "build": "next build",
//     "start": "next start",
//     "lint": "next lint"
//   },
//   "dependencies": {
//     "next": "13.5.0",
//     "react": "18.2.0",
//     "react-dom": "18.2.0"
//   },
//   "devDependencies": {
//     "autoprefixer": "^10.4.19",
//     "eslint": "^8.43.0",
//     "eslint-config-next": "13.5.0",
//     "postcss": "^8.4.41",
//     "tailwindcss": "^3.4.3",
//     "typescript": "^5.1.6"
//   }
// }
// </boltAction>
// <boltAction type="file" filePath="postcss.config.js">module.exports = {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
//   },
// };

// </boltAction>
// <boltAction type="file" filePath=".eslintrc.json">{
//   "extends": "next/core-web-vitals"
// }

// </boltAction>
// <boltAction type="file" filePath="tailwind.config.ts">import type { Config } from 'tailwindcss';

// const config: Config = {
//   darkMode: ['class'],
//   content: [
//     './pages/**/*.{js,ts,jsx,tsx,mdx}',
//     './components/**/*.{js,ts,jsx,tsx,mdx}',
//     './app/**/*.{js,ts,jsx,tsx,mdx}',
//   ],
//   theme: {
//     extend: {
//       backgroundImage: {
//         'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
//         'gradient-conic':
//           'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
//       },
//       borderRadius: {
//         lg: 'var(--radius)',
//         md: 'calc(var(--radius) - 2px)',
//         sm: 'calc(var(--radius) - 4px)',
//       },
//       colors: {
//         background: 'hsl(var(--background))',
//         foreground: 'hsl(var(--foreground))',
//         card: {
//           DEFAULT: 'hsl(var(--card))',
//           foreground: 'hsl(var(--card-foreground))',
//         },
//         popover: {
//           DEFAULT: 'hsl(var(--popover))',
//           foreground: 'hsl(var(--popover-foreground))',
//         },
//         primary: {
//           DEFAULT: 'hsl(var(--primary))',
//           foreground: 'hsl(var(--primary-foreground))',
//         },
//         secondary: {
//           DEFAULT: 'hsl(var(--secondary))',
//           foreground: 'hsl(var(--secondary-foreground))',
//         },
//         muted: {
//           DEFAULT: 'hsl(var(--muted))',
//           foreground: 'hsl(var(--muted-foreground))',
//         },
//         accent: {
//           DEFAULT: 'hsl(var(--accent))',
//           foreground: 'hsl(var(--accent-foreground))',
//         },
//         destructive: {
//           DEFAULT: 'hsl(var(--destructive))',
//           foreground: 'hsl(var(--destructive-foreground))',
//         },
//         border: 'hsl(var(--border))',
//         input: 'hsl(var(--input))',
//         ring: 'hsl(var(--ring))',
//         chart: {
//           '1': 'hsl(var(--chart-1))',
//           '2': 'hsl(var(--chart-2))',
//           '3': 'hsl(var(--chart-3))',
//           '4': 'hsl(var(--chart-4))',
//           '5': 'hsl(var(--chart-5))',
//         },
//       },
//       keyframes: {
//         'accordion-down': {
//           from: {
//             height: '0',
//           },
//           to: {
//             height: 'var(--radix-accordion-content-height)',
//           },
//         },
//         'accordion-up': {
//           from: {
//             height: 'var(--radix-accordion-content-height)',
//           },
//           to: {
//             height: '0',
//           },
//         },
//       },
//       animation: {
//         'accordion-down': 'accordion-down 0.2s ease-out',
//         'accordion-up': 'accordion-up 0.2s ease-out',
//       },
//     },
//   },
//   plugins: [require('tailwindcss-animate')],
// };
// export default config;

// </boltAction>
// <boltAction type="file" filePath="tsconfig.json">{
//   "compilerOptions": {
//     "target": "es5",
//     "lib": ["dom", "dom.iterable", "esnext"],
//     "allowJs": true,
//     "skipLibCheck": true,
//     "strict": true,
//     "noEmit": true,
//     "esModuleInterop": true,
//     "module": "esnext",
//     "moduleResolution": "bundler",
//     "resolveJsonModule": true,
//     "isolatedModules": true,
//     "jsx": "preserve",
//     "incremental": true,
//     "plugins": [
//       {
//         "name": "next"
//       }
//     ],
//     "paths": {
//       "@/*": ["./*"]
//     }
//   },
//   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
//   "exclude": ["node_modules"]
// }

// </boltAction>
// <boltAction type="file" filePath="next.config.js">/** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'export',
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   images: { unoptimized: true },
// };

// module.exports = nextConfig;

// </boltAction>
// <boltAction type="file" filePath="next-env.d.ts">/// <reference types="next" />
// /// <reference types="next/image-types/global" />

// // NOTE: This file should not be edited
// // see https://nextjs.org/docs/basic-features/typescript for more information.

// </boltAction>
// <boltAction type="file" filePath="app/layout.tsx">import './globals.css';
// import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'Create Next App',
//   description: 'Generated by create next app',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>{children}</body>
//     </html>
//   );
// }

// </boltAction>
// <boltAction type="file" filePath="app/page.tsx">'use client';

// import { useState } from 'react';

// interface Todo {
//   id: number;
//   text: string;
//   completed: boolean;
// }

// export default function Home() {
//   const [todos, setTodos] = useState<Todo[]>([]);
//   const [newTodo, setNewTodo] = useState('');

//   const addTodo = () => {
//     if (newTodo.trim()) {
//       setTodos([...todos, { id: Date.now(), text: newTodo.trim(), completed: false }]);
//       setNewTodo('');
//     }
//   };

//   const toggleTodo = (id: number) => {
//     setTodos(todos.map(todo =>
//       todo.id === id ? { ...todo, completed: !todo.completed } : todo
//     ));
//   };

//   const deleteTodo = (id: number) => {
//     setTodos(todos.filter(todo => todo.id !== id));
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       addTodo();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden">
//           <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//             <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
//               Todo List
//             </h1>
//           </div>
          
//           <div className="p-6">
//             <div className="flex gap-2 mb-6">
//               <input
//                 type="text"
//                 placeholder="Add a new todo..."
//                 value={newTodo}
//                 onChange={(e) => setNewTodo(e.target.value)}
//                 onKeyPress={handleKeyPress}
//                 className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
//               />
//               <button
//                 onClick={addTodo}
//                 className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
//               >
//                 Add
//               </button>
//             </div>

//             <div className="space-y-3">
//               {todos.map((todo) => (
//                 <div
//                   key={todo.id}
//                   className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm group hover:shadow-md transition-shadow duration-200"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={todo.completed}
//                     onChange={() => toggleTodo(todo.id)}
//                     className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
//                   />
//                   <span
//                     className='flex-1 line-through text-gray-700 dark:text-gray-100' 
//                   >
//                     {todo.text}
//                   </span>
//                   <button
//                     onClick={() => deleteTodo(todo.id)}
//                     className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
//                   >
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5 text-red-500"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <path d="M3 6h18" />
//                       <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
//                       <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
//                     </svg>
//                   </button>
//                 </div>
//               ))}

//               {todos.length === 0 && (
//                 <div className="text-center text-gray-500 dark:text-gray-400 py-8">
//                   No todos yet. Add one above!
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// </boltAction>
// <boltAction type="file" filePath="lib/utils.ts">import { clsx, type ClassValue } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// </boltAction>
// <boltAction type="file" filePath="app/globals.css">@tailwind base;
// @tailwind components;
// @tailwind utilities;

// :root {
//   --foreground-rgb: 0, 0, 0;
//   --background-start-rgb: 214, 219, 220;
//   --background-end-rgb: 255, 255, 255;
// }

// @media (prefers-color-scheme: dark) {
//   :root {
//     --foreground-rgb: 255, 255, 255;
//     --background-start-rgb: 0, 0, 0;
//     --background-end-rgb: 0, 0, 0;
//   }
// }

// @layer base {
//   :root {
//     --background: 0 0% 100%;
//     --foreground: 0 0% 3.9%;
//     --card: 0 0% 100%;
//     --card-foreground: 0 0% 3.9%;
//     --popover: 0 0% 100%;
//     --popover-foreground: 0 0% 3.9%;
//     --primary: 0 0% 9%;
//     --primary-foreground: 0 0% 98%;
//     --secondary: 0 0% 96.1%;
//     --secondary-foreground: 0 0% 9%;
//     --muted: 0 0% 96.1%;
//     --muted-foreground: 0 0% 45.1%;
//     --accent: 0 0% 96.1%;
//     --accent-foreground: 0 0% 9%;
//     --destructive: 0 84.2% 60.2%;
//     --destructive-foreground: 0 0% 98%;
//     --border: 0 0% 89.8%;
//     --input: 0 0% 89.8%;
//     --ring: 0 0% 3.9%;
//     --chart-1: 12 76% 61%;
//     --chart-2: 173 58% 39%;
//     --chart-3: 197 37% 24%;
//     --chart-4: 43 74% 66%;
//     --chart-5: 27 87% 67%;
//     --radius: 0.5rem;
//   }
//   .dark {
//     --background: 0 0% 3.9%;
//     --foreground: 0 0% 98%;
//     --card: 0 0% 3.9%;
//     --card-foreground: 0 0% 98%;
//     --popover: 0 0% 3.9%;
//     --popover-foreground: 0 0% 98%;
//     --primary: 0 0% 98%;
//     --primary-foreground: 0 0% 9%;
//     --secondary: 0 0% 14.9%;
//     --secondary-foreground: 0 0% 98%;
//     --muted: 0 0% 14.9%;
//     --muted-foreground: 0 0% 63.9%;
//     --accent: 0 0% 14.9%;
//     --accent-foreground: 0 0% 98%;
//     --destructive: 0 62.8% 30.6%;
//     --destructive-foreground: 0 0% 98%;
//     --border: 0 0% 14.9%;
//     --input: 0 0% 14.9%;
//     --ring: 0 0% 83.1%;
//     --chart-1: 220 70% 50%;
//     --chart-2: 160 60% 45%;
//     --chart-3: 30 80% 55%;
//     --chart-4: 280 65% 60%;
//     --chart-5: 340 75% 55%;
//   }
// }

// @layer base {
//   * {
//     @apply border-border;
//   }
//   body {
//     @apply bg-background text-foreground;
//   }
// }

// </boltAction>
// <boltAction type="file" filePath=".gitignore">node_modules
// .next
// out
// dist
// .env.local
// .env.development.local
// .env.test.local
// .env.production.local
// </boltAction>
// </boltArtifact>`;




















































