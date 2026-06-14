import NotFound from "./pages/NotFound";
import NewTask from "./pages/NewTask";
import Report from "./pages/Report";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";

export const routers = [
  {
    path: "/",
    name: "home",
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
