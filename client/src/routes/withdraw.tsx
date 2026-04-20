import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import Withdraw from '@/pages/Withdraw'

export const Route = createFileRoute('/withdraw')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Withdraw,
})