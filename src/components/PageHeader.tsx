import { ReactNode } from "react";

interface PageHeaderProps {
  index?: number;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ index, eyebrow, title, description, actions }: PageHeaderProps) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
    <div className="flex items-start gap-4">
      {index !== undefined && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/80 text-sm font-semibold">
          {String(index).padStart(2, "0")}
        </span>
      )}
      <div>
        {eyebrow && <div className="label-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="display text-3xl sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
