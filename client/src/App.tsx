import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/UI/LoadingSpinner'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  )
}

export default App