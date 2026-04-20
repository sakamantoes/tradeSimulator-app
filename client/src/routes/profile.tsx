import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import Profile from '@/pages/Profile'

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Profile,
})