import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, CheckCircle2, AlertTriangle, PlusCircle, Loader2,
  Video, MessageSquareText,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserSessions, UserSessionRecord } from "@/lib/api";
import { dirKey, typeKey, INTERVIEW_TYPES, InterviewType } from "@/lib/interview";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const HistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InterviewType | "all">("all");

  useEffect(() => {
    getUserSessions()
      .then(setSessions)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? sessions : sessions.filter((s) => s.interviewType === filter)),
    [sessions, filter],
  );

  return (
    <AppLayout activePath="/history">
      <PageHeader
        eyebrow={t("history.eyebrow")}
        title={t("history.title")}
        description={t("history.subtitle")}
        actions={
          <Button onClick={() => navigate("/new")} className="rounded-full">
            <PlusCircle className="mr-2 h-4 w-4" />{t("dash.newInterview")}
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label={t("history.all")} />
        {INTERVIEW_TYPES.map((it) => (
          <FilterPill key={it.value} active={filter === it.value} onClick={() => setFilter(it.value)} label={t(it.labelKey)} />
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("history.loading")}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-14 text-center">
          <p className="text-sm text-muted-foreground">
            {sessions.length === 0 ? t("history.emptyNew") : t("history.empty")}
          </p>
          {sessions.length === 0 && (
            <Button onClick={() => navigate("/new")} className="rounded-full">
              <PlusCircle className="mr-2 h-4 w-4" />{t("dash.empty.cta")}
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.sessionId} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="display text-2xl tabular-nums">{s.score}</span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">{s.grade}</span>
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                      {s.mode === "video" ? <Video className="h-3 w-3" /> : <MessageSquareText className="h-3 w-3" />}
                      {s.mode === "video" ? t("feedback.mode.video") : t("feedback.mode.text")}
                    </span>
                  </div>
                  <div className="mt-2 text-base font-semibold">{s.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(dirKey(s.jobDirection))} · {t(typeKey(s.interviewType))} · {formatDate(s.date, i18n.language)}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full"
                  onClick={() => navigate(`/feedback?sessionId=${s.sessionId}`)}>
                  {t("history.review")}<ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
              {(s.strengths.length > 0 || s.weaknesses.length > 0) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <TagRow icon={CheckCircle2} tone="success" items={s.strengths.slice(0, 2)} />
                  <TagRow icon={AlertTriangle} tone="muted" items={s.weaknesses.slice(0, 2)} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

const FilterPill = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
  <button onClick={onClick}
    className={cn(
      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-smooth",
      active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
    )}>
    {label}
  </button>
);

const TagRow = ({ icon: Icon, tone, items }: { icon: typeof CheckCircle2; tone: "success" | "muted"; items: string[] }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Icon className={cn("h-4 w-4 shrink-0", tone === "success" ? "text-success" : "text-muted-foreground")} />
    {items.map((it, i) => (
      <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{it}</span>
    ))}
  </div>
);

export default HistoryPage;
