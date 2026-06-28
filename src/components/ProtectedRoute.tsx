import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground" />
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
