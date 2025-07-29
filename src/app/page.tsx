"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaFigma } from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Ensure axios sends cookies with requests
axios.defaults.withCredentials = true;

export default function Sidebar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [history, setHistory] = useState<
    { _id: string; prompt: string; modelName: string }[] | null
  >(null);
  // const lastUserId = useRef<string | null>(null);
  const lastUserId = useRef<string | null | undefined>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const limit = 10;
  const [model, setModel] = useState("gemini-2.0-flash");
  const [prompt, setPrompt] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });

    document.cookie = "next-auth.session-token=; Max-Age=0; path=/";
    document.cookie = "__Secure-next-auth.session-token=; Max-Age=0; path=/";

    window.location.replace("/login");
  };

  // Redirect unauthenticated users client-side
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Fetch user history from API
  const fetchHistory = useCallback(async () => {
    if (!hasMore || loading || status !== "authenticated") return;

    setLoading(true);

    try {
      const res = await axios.get(
        `/api/generation/history?limit=${limit}&skip=${skip}`
      );
      const newData = res.data.data;

      if (!Array.isArray(newData) || newData.length === 0) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      setHistory((prev) => {
        const safePrev = prev ?? [];
        const existingIds = new Set(safePrev.map((item) => item._id));
        const newUnique = newData.filter((item) => !existingIds.has(item._id));
        return [...safePrev, ...newUnique];
      });

      setSkip((prev) => prev + limit);

      if (newData.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch prompt history", err);
    } finally {
      setLoading(false);
    }
  }, [skip, hasMore, loading, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setHistory([]);
      setSkip(0);
      setHasMore(true);
      lastUserId.current = null;
      return;
    }

    if (session?.user?.id !== lastUserId.current) {
      setHistory([]);
      setSkip(0);
      setHasMore(true);
      lastUserId.current = session.user.id;
      fetchHistory();
    }
  }, [status, session?.user?.id, fetchHistory]);


  // Scroll listener to fetch more when reaching bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10
      ) {
        fetchHistory();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchHistory]);

  const handleSuggestionClick = (suggestion: string, shouldRedirect = false) => {
    if (shouldRedirect) {
      const encodedPrompt = encodeURIComponent(suggestion);
      router.push(`/builder?prompt=${encodedPrompt}&model=${model}`);
    } else {
      setPrompt(suggestion);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      const stored = JSON.parse(localStorage.getItem("prompt-history") || "[]");
      const filtered = stored.filter(
        (entry: { prompt: string }) => entry.prompt !== prompt
      );
      const updated = [{ prompt, model }, ...filtered].slice(0, 10);
      localStorage.setItem("prompt-history", JSON.stringify(updated));

      router.push(
        `/builder?prompt=${encodeURIComponent(
          prompt
        )}&model=${encodeURIComponent(model)}`
      );
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/generation/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete history");
      }

      // Remove deleted item from local state
      setHistory((prev) => prev?.filter((item) => item._id !== id) ?? []);
      setOpenMenuId(null);
    } catch (error) {
      console.error("❌ Error deleting history:", error);
      alert("Failed to delete history item.");
    }
  };


  if (status === "loading")
    return (
      <p className="text-white text-center mt-10">
        Loading user session...
      </p>
    );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full flex fixed top-0 justify-between px-5 pt-2 bg-black items-center z-50">
        <div className="top-4 left-6">
          <Link href={"/"} className="text-white font-bold text-xl">
            DevKit
          </Link>
        </div>

        <div className="top-4 right-4 flex items-center space-x-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
              className="w-full h-32 p-5 bg-zinc-900 tracking-normal border border-zinc-800 rounded-xl outline-none resize-none placeholder-zinc-500 text-md pr-12 pb-12" // extra bottom padding
              aria-label="Website description"
            />

            {/* Gemini model select dropdown */}
            <div className="absolute left-5 bottom-5 z-10 w-48">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm rounded-md">
                  <SelectValue placeholder="Choose Gemini model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-700 text-white">
                  <SelectItem
                    value="gemini-2.0-flash"
                    className="hover:bg-zinc-700 text-white cursor-pointer"
                  >
                    Gemini 2.0 Flash
                  </SelectItem>
                  <SelectItem
                    value="gemini-2.5-pro"
                    className="hover:bg-zinc-700 text-white cursor-pointer"
                  >
                    Gemini 2.5 Pro
                  </SelectItem>
                  <SelectItem
                    value="gemini-2.0-flash-lite"
                    className="hover:bg-zinc-700 text-white cursor-pointer"
                  >
                    Gemini 2.0 Flash Lite
                  </SelectItem>
                  <SelectItem
                    value="gemini-2.5-flash-preview-05-20"
                    className="hover:bg-zinc-700 text-white cursor-pointer"
                  >
                    Gemini 2.5 Flash (05‑20 preview)
                  </SelectItem>
                  <SelectItem
                    value="gemini-2.5-flash-preview-04-17"
                    className="hover:bg-zinc-700 text-white cursor-pointer"
                  >
                    Gemini 2.5 Flash (04‑17 preview)
                  </SelectItem>
                </SelectContent>
              </Select>
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

          <p className="text-center text-zinc-500 text-sm mt-6">
            or start a blank app with your favorite stack
          </p>
        </form>

      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-zinc-900 text-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div>
          <div
            ref={containerRef}
            className="rounded-lg h-screen shadow-md max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 space-y-1 scrollbar-hide"
          >
            {history?.length === 0 ? (
              <p className="text-zinc-400 text-sm text-center py-4">
                No history found
              </p>
            ) : (
              history?.map((item) => (
                <div key={item._id} className="relative w-full">
                  <div className="flex items-center justify-between px-1 py-2 hover:bg-gray-800 rounded-md">
                    <button
                      onClick={() => {
                        const encodedPrompt = encodeURIComponent(item.prompt);
                        const encodedModel = encodeURIComponent(
                          item.modelName || "gemini-2.5-flash-preview-05-20"
                        );
                        router.push(
                          `/builder?prompt=${encodedPrompt}&model=${encodedModel}&id=${item._id}`
                        );
                      }}
                      className="flex-1 text-left text-sm text-zinc-300 hover:text-white truncate focus:outline-none"
                      title={item.prompt}
                    >
                      {item.prompt}
                    </button>

                    <div className="relative ml-2">
                      <button
                        className="text-zinc-400 hover:text-white px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) => (prev === item._id ? null : item._id));
                        }}
                      >
                        ⋮
                      </button>

                      {/* Fix: Use top-full to place dropdown directly below */}
                      {openMenuId === item._id && (
                        <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-md text-sm z-50">
                          <div
                            onClick={() => handleDeleteHistory(item._id)}
                            className="px-4 py-2 text-red-500 hover:bg-zinc-700 cursor-pointer">
                            Delete
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            // onClick={() => {
            //   setHistory([]);
            //   setSkip(0);
            //   setHasMore(true);
            //   fetchHistory();
            // }}
            onClick={async () => {
              try {
                const res = await fetch("/api/generation/delete", {
                  method: "DELETE",
                });

                if (!res.ok) throw new Error("Failed to clear history");

                setHistory([]);
                setSkip(0);
                setHasMore(true);
                fetchHistory(); // Optional: refresh new data if needed
              } catch (error) {
                console.error("❌ Error clearing history:", error);
                alert("Failed to clear history.");
              }
            }}
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
  );
}