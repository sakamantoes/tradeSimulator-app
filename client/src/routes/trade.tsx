import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import Trade from '@/pages/Trade'

export const Route = createFileRoute('/trade')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Trade,
})