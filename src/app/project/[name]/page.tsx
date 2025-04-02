'use client'

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Send, Lock, Unlock, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function Home({
    params,
  }: {
    params: { name: string }
  }) {
    const decodedName = decodeURIComponent(params.name)
  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed Sidebar with Chat */}
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">
              <Button variant={'ghost'} onClick={()=>window.history.back()}>
              <ArrowLeft/>
              </Button>
               Chat with Project Development</h2>
          </div>
          
          {/* Chat Messages Area - Scrollable */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${
                  i % 2 === 0 ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    i % 2 === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">
                    {i % 2 === 0
                      ? 'This is a sample message from you'
                      : 'This is a sample response message'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - with padding for sidebar */}
      <main className="flex-1 p-6 lg:pl-[20rem]">
        {/* Header with Project Name and Privacy Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl font-bold">Project Name : {decodedName}</h1>
          </div>
          <div className="flex items-center gap-2">
              <Switch id="privacy" />
              <Label htmlFor="privacy" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Private</span>
              </Label>
            </div>
          {/* <ThemeToggle /> */}
        </div>

        {/* Search bar */}
        <div className="relative mb-6 flex items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              className="w-full pl-9 pr-20"
              placeholder="Search files..."
              type="search"
            />
          </div>
          <Button className="absolute right-1 top-1/2 -translate-y-1/2 transform">
            Search
          </Button>
        </div>

        {/* Project Files Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <Card
              key={i}
              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <h3 className="font-semibold">File {i + 1}</h3>
              <p className="text-sm text-muted-foreground">
                File description goes here
              </p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

