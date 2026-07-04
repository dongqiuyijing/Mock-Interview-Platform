import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const CtaStatement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <p
          className="label-eyebrow text-background/60"
          style={{ color: "hsl(var(--background) / 0.6)" }}
        >
          Stop winging it
        </p>
        <h2 className="display mt-6 max-w-[18ch] text-5xl leading-[0.98] sm:text-7xl">
          Walk in already having done it once.
        </h2>
        <div className="mt-12">
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full px-8"
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
          >
            {user ? "Go to dashboard" : "Start free"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
