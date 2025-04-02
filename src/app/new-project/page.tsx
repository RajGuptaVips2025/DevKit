import { redirect } from 'next/navigation'
import { CreateProjectDialog } from '@/components/create-project-dialog'

export default function NewProjectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <CreateProjectDialog />
    </div>
  )
}

