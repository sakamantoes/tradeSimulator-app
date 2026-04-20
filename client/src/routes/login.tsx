import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import Login from '@/pages/Login'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Login,
})