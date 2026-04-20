import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/user'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore()

  const { data, isLoading: isFetching } = useQuery({
    queryKey: ['me'],
    queryFn: () => userService.getMe(),
    enabled: !!token && !user,
    retry: false,
    onError: () => {
      logout()
      toast.error('Session expired. Please login again.')
    },
    onSuccess: (userData) => {
      if (userData) {
        login(userData, token!)
      }
    },
  })

  useEffect(() => {
    if (token && !user && !isFetching) {
      setLoading(true)
    } else {
      setLoading(false)
    }
  }, [token, user, isFetching, setLoading])

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isFetching,
    login,
    logout,
  }
}