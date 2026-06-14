import { cn } from "@/lib/utils";

export type SpeakState = "speaking" | "listening" | "thinking" | "idle";

interface InterviewerAvatarProps {
  state: SpeakState;
  /** Compact variant for the small self-view style tiles. */
  className?: string;
}

/**
 * Professional AI interviewer "video feed" card. Uses a static portrait plus
 * a subtle speaking indicator to simulate a live remote interviewer.
 */
export const InterviewerAvatar = ({ state, className }: InterviewerAvatarProps) => {
  const speaking = state === "speaking";
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-900",
        className,
      )}
    >
      <img
        src="/ai-interviewer.png"
        alt="AI interviewer"
        crossOrigin="anonymous"
        className="h-full w-full object-cover"
      />
      {/* Soft vignette for a webcam feel */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

      {/* Speaking ring */}
      {speaking && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-emerald-400/70" />
      )}

      {/* Speaking audio bars */}
      {speaking && (
        <div className="absolute bottom-3 left-3 flex items-end gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-emerald-400"
              style={{
                height: `${6 + (i % 3) * 5}px`,
                animation: `eq 0.8s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
