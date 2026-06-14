import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const SectionCard = ({ icon: Icon, title, children, accent = "primary" }: SectionCardProps) => (
  <Card className="p-6">
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentMap[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold">{title}</h3>
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
  dot: "bg-muted-foreground",
  check: "bg-success",
  warn: "bg-warning",
  risk: "bg-destructive",
};

export const BulletList = ({ items, marker = "dot", empty }: BulletListProps) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty ?? "—"}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${markerColor[marker]}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};
