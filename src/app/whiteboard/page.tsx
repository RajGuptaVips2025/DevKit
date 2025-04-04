'use client'

import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

export default function WhiteboardPage() {
  return (
    <div className="w-full h-screen">
      <Tldraw />
    </div>
  )
}

