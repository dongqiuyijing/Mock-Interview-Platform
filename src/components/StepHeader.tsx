import { useTranslation } from "react-i18next";

interface StepHeaderProps {
  index: number; // 1-based
  total?: number;
  title: string;
  description?: string;
}

export const StepHeader = ({ index, total = 4, title, description }: StepHeaderProps) => {
  const { t } = useTranslation();
  const num = String(index).padStart(2, "0");

  return (
    <div className="lg:sticky lg:top-28">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/80 text-sm font-semibold">
          {num}
        </span>
        <span className="label-eyebrow">
          {t("step.indexLabel", { index, total })}
        </span>
      </div>

      <h1 className="display mt-8 text-4xl leading-[1.05] sm:text-5xl">{title}</h1>

      {description && (
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};
