import { FileSearch, Video, Radar } from "lucide-react";

export const Bento = () => {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="label-eyebrow mb-4">Inside the workspace</p>
        <h2 className="display max-w-[16ch] text-4xl leading-[1.02] sm:text-5xl">
          Everything a panel judges you on, rehearsed first.
        </h2>

        <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Large feature */}
          <article className="flex flex-col justify-between rounded-lg border border-border bg-card p-8 lg:col-span-2 lg:row-span-2">
            <FileSearch className="h-6 w-6" strokeWidth={1.5} />
            <div className="mt-16">
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                JD × resume, scored line by line
              </h3>
              <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                We surface the must-haves the posting only implies, flag the
                gaps a recruiter will circle, and hand you the exact projects
                worth deep-diving — before the first question lands.
              </p>
            </div>
          </article>

          {/* Video */}
          <article className="rounded-lg border border-border bg-card p-8">
            <Video className="h-6 w-6" strokeWidth={1.5} />
            <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">
              Live video rounds
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Speak your answers on camera. Composure, pace and clarity all get
              scored, not just the words.
            </p>
          </article>

          {/* Radar */}
          <article className="rounded-lg border border-border bg-card p-8">
            <Radar className="h-6 w-6" strokeWidth={1.5} />
            <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">
              Ability radar
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Seven dimensions tracked across sessions, so you can watch the
              weak edges close over time.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};
