"use client"

import type React from "react"
import { Aperture, ArrowRight, Link as Laaa } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FaDiscord } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaFigma } from "react-icons/fa";
import Link from "next/link";


interface Document {
  _id: string
  title: string
  content: string
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      router.push(`/builder?prompt=${encodeURIComponent(prompt)}`)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full flex fixed top-0 justify-between px-5 pt-2 bg-black items-center ">
        <div className=" top-4 left-6">
          <Link href={'/'} className="text-white font-bold text-xl">bolt</Link>
        </div>

        <div className=" top-4 right-4 flex space-x-2">
          <Link href="https://x.com/" target="_blank" className="text-white">
            <FaXTwitter className="w-4 h-4" />
          </Link>
          <Link href="https://in.linkedin.com/" target="_blank"  className="text-white">
            <FaLinkedin className="w-4 h-4" />
          </Link>
          <Link href="https://discord.com/" target="_blank" className="text-white">
            <FaDiscord className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="w-full max-w-3xl mt-3 mx-auto">
        <div className="text-center mb-6">
          <div className="bg-zinc-900 text-white text-sm py-2 px-4 rounded-full inline-flex items-center mb-10">
            <span className="mr-2"><FaFigma /></span>
            <span>New! Introducing Figma to Bolt</span>
          </div>

          <h1 className="text-4xl font-bold mb-3">What do you want to build?</h1>
          <p className="text-sm text-gray-400">
            Prompt, run, edit, and deploy full-stack <span className="text-white">web</span> and{" "}
            <span className="text-white">mobile</span> apps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative mb-8">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="How can Bolt help you today?"
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
              Import from Figma
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
    </div>
  )
}


























