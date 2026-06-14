import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepId = "create" | "analysis" | "interview" | "feedback";

const STEPS: { id: StepId; labelKey: string }[] = [
  { id: "create", labelKey: "step.create" },
  { id: "analysis", labelKey: "step.analysis" },
  { id: "interview", labelKey: "step.interview" },
  { id: "feedback", labelKey: "step.feedback" },
];

interface StepperProps {
  current: StepId;
}

export const Stepper = ({ current }: StepperProps) => {
  const { t } = useTranslation();
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="progress" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={step.id} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-smooth",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary-soft text-primary",
                    !isDone && !isCurrent && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block transition-smooth",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-px flex-1 transition-smooth",
                    i < currentIndex ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
