import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* faint editorial grid lines */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-[0.55]" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="flex items-center gap-4">
          <span className="display text-sm text-foreground/30">01</span>
          <span className="label-eyebrow">AI mock interview workspace</span>
        </div>

        <h1 className="display-hero mt-8 animate-fade-in">
          Rehearse the
          <br />
          interview.
          <br />
          <span className="text-foreground/35">Own the room.</span>
        </h1>

        <p className="mt-10 max-w-[58ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          RoleReady turns a job description and your resume into a tailored,
          pressure-tested interview — then hands back a scorecard sharp enough to
          actually train against.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
          >
            {user ? "Go to dashboard" : "Start free"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8"
            onClick={() => {
              document
                .getElementById("how")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            See how it works
            <ArrowDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
