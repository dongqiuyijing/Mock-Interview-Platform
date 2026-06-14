import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import NewTask from "./pages/NewTask";
import Report from "./pages/Report";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";
import HistoryPage from "./pages/HistoryPage";
import Skills from "./pages/Skills";
import TrainingPlan from "./pages/TrainingPlan";

export const routers = [
  {
    path: "/",
    name: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "/new",
    name: "new",
    element: <NewTask />,
  },
  {
    path: "/analysis",
    name: "analysis",
    element: <Report />,
  },
  {
    path: "/interview",
    name: "interview",
    element: <Interview />,
  },
  {
    path: "/feedback",
    name: "feedback",
    element: <Feedback />,
  },
  {
    path: "/history",
    name: "history",
    element: <HistoryPage />,
  },
  {
    path: "/skills",
    name: "skills",
    element: <Skills />,
  },
  {
    path: "/plan",
    name: "plan",
    element: <TrainingPlan />,
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
