import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { History as HistoryIcon, ArrowRight, CheckCircle2, AlertTriangle, PlusCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { store } from "@/lib/workspaceStore";
import { dirKey, typeKey, INTERVIEW_TYPES, InterviewType } from "@/lib/interview";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const HistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const sessions = useMemo(() => store.getSessions(), []);
  const [filter, setFilter] = useState<InterviewType | "all">("all");

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.interviewType === filter);

  const openReview = (id: string) => {
    // If this session is the active feedback, go there; otherwise route to feedback view.
    const fb = store.getFeedback();
    if (fb) navigate("/feedback");
    else navigate("/feedback");
    void id;
  };

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

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="display text-2xl tabular-nums">{s.score}</span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">{s.grade}</span>
                  </div>
                  <div className="mt-2 text-base font-semibold">{s.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(dirKey(s.jobDirection))} · {t(typeKey(s.interviewType))} · {formatDate(s.date, i18n.language)}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => openReview(s.id)}>
                  {t("history.review")}<ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TagRow icon={CheckCircle2} tone="success" items={s.strengths.map((k) => t(k))} />
                <TagRow icon={AlertTriangle} tone="muted" items={s.weaknesses.map((k) => t(k))} />
              </div>
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
