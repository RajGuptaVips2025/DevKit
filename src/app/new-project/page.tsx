"use client"

import { useState } from "react"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export default function NewProjectPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center flex-col p-4">
      <button
        className="mb-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        onClick={() => setOpen(true)}
      >
        New Project
      </button>

      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  )
}










