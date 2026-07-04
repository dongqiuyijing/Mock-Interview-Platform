import { TrendingUp, Target, Radar as RadarIcon } from "lucide-react";

const ABILITIES = [
  { name: "Product Thinking", value: 82 },
  { name: "AI Technical Depth", value: 74 },
  { name: "Communication", value: 88 },
  { name: "Business Judgment", value: 69 },
];

const HISTORY = [
  { title: "Senior AI Product Manager", meta: "AI PM · Jul 3", grade: "A-", score: 86 },
  { title: "LLM Application Engineer", meta: "AI Eng · Jun 28", grade: "B+", score: 79 },
];

export const DashboardPreview = () => {
  return (
    <div className="w-full rounded-lg border border-border bg-card p-4 shadow-elegant sm:p-5">
      {/* window chrome */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 label-eyebrow">Dashboard</span>
      </div>

      {/* top metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-4">
          <div className="mb-2 flex items-center gap-1.5 label-eyebrow">
            <TrendingUp className="h-3.5 w-3.5" />
            Readiness
          </div>
          <div className="flex items-end gap-1">
            <span className="display text-4xl">78</span>
            <span className="mb-1.5 text-xs text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-foreground" style={{ width: "78%" }} />
          </div>
        </div>

        <div className="rounded-md bg-foreground p-4 text-background">
          <div className="mb-2 flex items-center gap-1.5 label-eyebrow" style={{ color: "hsl(var(--background) / 0.65)" }}>
            <Target className="h-3.5 w-3.5" />
            Last round
          </div>
          <div className="flex items-end justify-between">
            <span className="display text-4xl">A-</span>
            <span className="text-xs" style={{ color: "hsl(var(--background) / 0.7)" }}>86/100</span>
          </div>
          <div className="mt-3 truncate text-xs font-medium">Senior AI PM</div>
        </div>
      </div>

      {/* skills */}
      <div className="mt-3 rounded-md border border-border p-4">
        <div className="mb-3 flex items-center gap-1.5 label-eyebrow">
          <RadarIcon className="h-3.5 w-3.5" />
          Ability radar
        </div>
        <div className="space-y-2.5">
          {ABILITIES.map((s) => (
            <div key={s.name}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium">{s.name}</span>
                <span className="tabular-nums text-muted-foreground">{s.value}</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${s.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* history */}
      <div className="mt-3 space-y-2">
        {HISTORY.map((h) => (
          <div
            key={h.title}
            className="flex items-center justify-between rounded-md border border-border p-3"
          >
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{h.title}</div>
              <div className="text-[11px] text-muted-foreground">{h.meta}</div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold">
                {h.grade}
              </span>
              <span className="display text-base tabular-nums">{h.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
