"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export function CreateProjectDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [projectName, setProjectName] = useState("")
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [errors, setErrors] = useState({ name: false, thumbnail: false })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({ name: false, thumbnail: false })
    
    // Validate inputs
    const newErrors = {
      name: !projectName.trim(),
      thumbnail: !thumbnail
    }
    
    if (newErrors.name || newErrors.thumbnail) {
      setErrors(newErrors)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      })
      return
    }

    // Handle successful creation
    toast({
      title: "Success",
      description: "Project created successfully"
    })
    
    // Close dialog and navigate to the new project
    onOpenChange(false)
    router.push(`/project/${encodeURIComponent(projectName)}`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnail(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={errors.name ? "border-red-500" : ""}
                placeholder="Enter project name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">Project name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project Thumbnail</Label>
              <div className="flex flex-col items-center gap-4">
                {thumbnail ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <Image
                      src={thumbnail}
                      alt="Project thumbnail"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={() => setThumbnail(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 hover:bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload thumbnail
                    </span>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
                {errors.thumbnail && (
                  <p className="text-sm text-red-500">Thumbnail is required</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  )
}

