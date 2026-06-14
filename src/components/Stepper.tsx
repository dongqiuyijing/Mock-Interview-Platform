import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepId = "create" | "analysis" | "interview" | "feedback";

const STEPS: StepId[] = ["create", "analysis", "interview", "feedback"];

interface StepperProps {
  current: StepId;
}

export const Stepper = ({ current }: StepperProps) => {
  const currentIndex = STEPS.findIndex((s) => s === current);

  return (
    <nav aria-label="progress" className="hidden items-center gap-1.5 md:flex">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-smooth",
                isDone && "border-foreground bg-foreground text-background",
                isCurrent && "border-foreground text-foreground",
                !isDone && !isCurrent && "border-border text-muted-foreground",
              )}
            >
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-5 transition-smooth",
                  i < currentIndex ? "bg-foreground" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
};
