import { createFileRoute } from '@tanstack/react-router'
import { AdminSubmissions } from '#/admin/AdminSubmissions'

export const Route = createFileRoute('/backend/submissions/free-quran')({
  component: function SubmissionsFreeQuran() {
    return <AdminSubmissions formType="free_quran" />
  },
})
