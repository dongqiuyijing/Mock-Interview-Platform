import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import { SkillDimension } from "@/lib/workspaceStore";
import { cn } from "@/lib/utils";

interface SkillBarsProps {
  skills: SkillDimension[];
  showDelta?: boolean;
}

export const SkillBars = ({ skills, showDelta = true }: SkillBarsProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {skills.map((s) => (
        <div key={s.key}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium">{t(`skill.${s.key}`)}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {showDelta && s.delta > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                  <ArrowUp className="h-3 w-3" />{s.delta}
                </span>
              )}
              <span className="tabular-nums">{s.current}</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className={cn("h-full rounded-full bg-foreground transition-smooth")}
              style={{ width: `${s.current}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
