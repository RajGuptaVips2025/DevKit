"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aperture, ArrowRight, Link as Laaa } from "lucide-react";
import { FaFigma } from "react-icons/fa";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);
  
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("prompt-history") || "[]");
    setHistory(stored);
  }, [isSidebarOpen]); // Re-fetch when sidebar opens

  if (session === undefined) {
    return <p className="text-white text-center mt-10">Loading...</p>;
  }

  if (session === null) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      // Save to history
      const stored = JSON.parse(localStorage.getItem("prompt-history") || "[]");
      const updated = [prompt, ...stored.filter((p: string) => p !== prompt)].slice(0, 10); // Remove duplicates, keep recent 10
      localStorage.setItem("prompt-history", JSON.stringify(updated));

      router.push(`/builder?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  const handleSuggestionClick = (suggestion: string, shouldRedirect = false) => {
    if (shouldRedirect) {
      const encodedPrompt = encodeURIComponent(suggestion);
      router.push(`/builder?prompt=${encodedPrompt}`);
    } else {
      setPrompt(suggestion);
    }
  };


  const handleLogout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login`, redirect: false });
    setTimeout(() => {
      window.location.href = "/login";
    }, 300);
  };

  const handleClearHistory = () => {
    // Clear static prompt history
    localStorage.removeItem("prompt-history");
    setHistory([]);

    // Dynamically clear all ai-* keys
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("ai-steps-") ||
        key.startsWith("ai-files-") ||
        key.startsWith("ai-selected-") ||
        key.startsWith("ai-generated-") ||
        key.startsWith("ai-edited-")
      ) {
        localStorage.removeItem(key);
      }
    });

    // Optional: feedback
    console.log("All chat history and AI-related data removed.");
  };




  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full flex fixed top-0 justify-between px-5 pt-2 bg-black items-center z-50">
        <div className="top-4 left-6">
          <Link href={'/'} className="text-white font-bold text-xl">DevKit</Link>
        </div>

        <div className="top-4 right-4 flex items-center space-x-2">
          <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-3xl mt-20 mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-3">What do you want to build?</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative mb-8">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="How can DevKit help you today?"
              className="w-full h-32 p-5 bg-zinc-900 tracking-normal border border-zinc-800 rounded-xl outline-none resize-none placeholder-zinc-500 text-md"
              aria-label="Website description"
            />
            <div className="absolute bottom-4 left-3 flex text-zinc-500">
              <button type="button" className="p-2 hover:text-zinc-300">
                <Laaa size={20} />
              </button>
              <button type="button" className="p-2 hover:text-zinc-300">
                <Aperture />
              </button>
            </div>

            {prompt.trim() && (
              <button
                type="submit"
                className="absolute right-4 top-4 bg-blue-400 text-sm px-2 py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors"
              >
                <ArrowRight />
              </button>
            )}
          </div>

          <div className="w-11/12 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => handleSuggestionClick("Import from Figma")}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-xs hover:bg-zinc-800 transition-colors flex items-center"
            >
              <FaFigma size={15} />
              &nbsp;Import from Figma
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Build a mobile app with Expo")}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-xs hover:bg-zinc-800 transition-colors"
            >
              Build a mobile app with Expo
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Start a blog with Astro")}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-xs hover:bg-zinc-800 transition-colors"
            >
              Start a blog with Astro
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Create a docs site with Vitepress")}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-xs hover:bg-zinc-800 transition-colors"
            >
              Create a docs site with Vitepress
            </button>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Scaffold UI with shadcn")}
              className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-xs hover:bg-zinc-800 transition-colors"
            >
              Scaffold UI with shadcn
            </button>
          </div>

          <p className="text-center text-zinc-500 text-sm mt-6">or start a blank app with your favorite stack</p>
        </form>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-zinc-900 text-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-white text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="space-y-4">

        <div className="mt-6">
          <div className=" rounded-lg shadow-md  max-h-48 overflow-y-auto  scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 space-y-1">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  const encodedPrompt = encodeURIComponent(item);
                  router.push(`/builder?prompt=${encodedPrompt}`);
                }}
                className="w-full text-left text-sm text-zinc-300 hover:text-white hover:bg-gray-800 rounded-md px-1 py-2 truncate transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title={item}
              >
                {item}
              </button>
            ))}
          </div>

          {/* 👇 Add this Clear History button */}
          <button
            onClick={handleClearHistory}
            className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded text-sm transition"
          >
            Clear History
          </button>

          <button
            onClick={handleLogout}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm transition"
          >
            Logout
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}















