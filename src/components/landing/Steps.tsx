const STEPS = [
  {
    n: "01",
    title: "Drop in the JD and your resume",
    body: "RoleReady reads both, maps the real requirements against your evidence, and scores the match before you say a word.",
  },
  {
    n: "02",
    title: "Sit the interview, out loud",
    body: "A tailored interviewer asks one sharp question at a time — text or live video — and probes the weak answers the way a real panel would.",
  },
  {
    n: "03",
    title: "Read the scorecard, then drill",
    body: "Ability radar, risk answers, and rewritten model responses turn one rehearsal into a focused practice plan.",
  },
];

export const Steps = () => {
  return (
    <section id="how" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="label-eyebrow mb-14">How it works</p>
        <div className="grid gap-px bg-border sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-background px-6 pb-2 pt-8 sm:px-8">
              <div className="display text-6xl text-foreground/15">{s.n}</div>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
