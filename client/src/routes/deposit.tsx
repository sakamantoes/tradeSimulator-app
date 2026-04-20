import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import Deposit from '@/pages/Deposit'

export const Route = createFileRoute('/deposit')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Deposit,
})