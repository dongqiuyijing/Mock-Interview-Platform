import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  /** kept for API compatibility; visual style is uniformly monochrome */
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
}

export const SectionCard = ({ icon: Icon, title, children }: SectionCardProps) => (
  <Card className="p-7">
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
    </div>
    {children}
  </Card>
);

interface BulletListProps {
  items?: string[] | null;
  marker?: "dot" | "check" | "warn" | "risk";
  empty?: string;
}

const markerColor = {
  dot: "bg-foreground/40",
  check: "bg-success",
  warn: "bg-warning",
  risk: "bg-destructive",
};

export const BulletList = ({ items, marker = "dot", empty }: BulletListProps) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty ?? "—"}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${markerColor[marker]}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};
