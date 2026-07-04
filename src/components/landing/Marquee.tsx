const KEYWORDS = [
  "JD ANALYSIS",
  "STRESS ROUND",
  "VIDEO CALL",
  "SCORECARD",
  "RESUME MATCH",
  "ABILITY RADAR",
  "FOLLOW-UP PROBES",
  "TRAINING PLAN",
];

export const Marquee = () => {
  const row = [...KEYWORDS, ...KEYWORDS];
  return (
    <div className="overflow-hidden border-y border-border py-5">
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((word, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground/80">
              {word}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" />
          </span>
        ))}
      </div>
    </div>
  );
};
