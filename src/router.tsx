import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewTask from "./pages/NewTask";
import Report from "./pages/Report";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/login",
    name: "login",
    element: <Auth />,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks/new",
    name: "new-task",
    element: (
      <ProtectedRoute>
        <NewTask />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks/:id/report",
    name: "report",
    element: (
      <ProtectedRoute>
        <Report />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sessions/:id",
    name: "interview",
    element: (
      <ProtectedRoute>
        <Interview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sessions/:id/feedback",
    name: "feedback",
    element: (
      <ProtectedRoute>
        <Feedback />
      </ProtectedRoute>
    ),
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
