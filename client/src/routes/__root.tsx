import { createRootRoute, Outlet } from '@tanstack/react-router'
import { MainLayout } from '@/components/Layout/MainLayout'

export const rootRoute = createRootRoute({
  component: () => <MainLayout />,
})