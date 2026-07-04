import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const LandingNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/")}
          className="font-display text-lg font-extrabold tracking-tight"
        >
          RoleReady
        </button>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => navigate("/dashboard")}
            >
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => navigate("/auth")}
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/auth")}
              >
                Start free
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
