import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet, // ✅ import this
} from "@tanstack/react-router";

import Register from "../pages/Register";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

// ✅ 1. Root (FIXED)
const rootRoute = createRootRoute({
  component: () => (
    <div>
      <Outlet /> {/* 🔥 THIS MAKES "/" SHOW REGISTER */}
    </div>
  ),
});

// ✅ 2. Public routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/", // default route
  component: Register,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

// ✅ 3. Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

// ✅ 4. Admin (protected)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: async () => {
    const { useAuthStore } = await import("@/store/authStore");
    const { isAuthenticated, user } = useAuthStore.getState();

    if (!isAuthenticated || user?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <div>Admin Panel</div>,
});

// ✅ 5. Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  adminRoute,
]);

// ✅ 6. Router
export const router = createRouter({
  routeTree,
});