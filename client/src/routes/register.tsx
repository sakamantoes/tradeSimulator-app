import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import Register from '@/pages/Register'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Register,
})