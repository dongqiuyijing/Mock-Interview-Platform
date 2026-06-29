import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewTask from "./pages/NewTask";
import Report from "./pages/Report";
import Interview from "./pages/Interview";
import VideoInterview from "./pages/VideoInterview";
import Feedback from "./pages/Feedback";
import HistoryPage from "./pages/HistoryPage";
import Skills from "./pages/Skills";
import TrainingPlan from "./pages/TrainingPlan";
import ResumesPage from "./pages/Resumes";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const routers = [
  {
    path: "/auth",
    name: "auth",
    element: <Auth />,
  },
  {
    path: "/",
    name: "dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/new",
    name: "new",
    element: (
      <ProtectedRoute>
        <NewTask />
      </ProtectedRoute>
    ),
  },
  {
    path: "/analysis",
    name: "analysis",
    element: (
      <ProtectedRoute>
        <Report />
      </ProtectedRoute>
    ),
  },
  {
    path: "/interview",
    name: "interview",
    element: (
      <ProtectedRoute>
        <Interview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/video-interview",
    name: "video-interview",
    element: (
      <ProtectedRoute>
        <VideoInterview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/feedback",
    name: "feedback",
    element: (
      <ProtectedRoute>
        <Feedback />
      </ProtectedRoute>
    ),
  },
  {
    path: "/history",
    name: "history",
    element: (
      <ProtectedRoute>
        <HistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/skills",
    name: "skills",
    element: (
      <ProtectedRoute>
        <Skills />
      </ProtectedRoute>
    ),
  },
  {
    path: "/plan",
    name: "plan",
    element: (
      <ProtectedRoute>
        <TrainingPlan />
      </ProtectedRoute>
    ),
  },
  {
    path: "/resumes",
    name: "resumes",
    element: (
      <ProtectedRoute>
        <ResumesPage />
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
