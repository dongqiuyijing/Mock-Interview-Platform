import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import {
  ArrowUp, ArrowDown, Radar as RadarIcon, ArrowRight, TrendingUp,
  Loader2, PlusCircle,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserStats, UserStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Skills = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserStats()
      .then(setStats)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const abilities = stats?.abilities ?? [];

  if (loading) {
    return (
      <AppLayout activePath="/skills">
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("skills.loading")}
        </div>
      </AppLayout>
    );
  }

  if (abilities.length === 0) {
    return (
      <AppLayout activePath="/skills">
        <PageHeader eyebrow={t("skills.eyebrow")} title={t("skills.title")} description={t("skills.subtitle")} />
        <Card className="flex flex-col items-center gap-4 p-14 text-center">
          <RadarIcon className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">{t("skills.empty")}</p>
          <Button onClick={() => navigate("/new")} className="rounded-full">
            <PlusCircle className="mr-2 h-4 w-4" />{t("dash.empty.cta")}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  const chartData = abilities.map((s) => ({ name: s.name, score: s.current }));
  const readiness = stats?.readiness ?? 0;
  const improved = abilities.filter((s) => s.delta > 0).length;

  return (
    <AppLayout activePath="/skills">
      <PageHeader
        eyebrow={t("skills.eyebrow")}
        title={t("skills.title")}
        description={t("skills.subtitle")}
        actions={
          <Button onClick={() => navigate("/new")} variant="outline" className="rounded-full">
            {t("dash.newInterview")}<ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Radar */}
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2 label-eyebrow">
            <RadarIcon className="h-4 w-4" />{t("skills.map")}
          </div>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} outerRadius="72%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Radar dataKey="score" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.12} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Summary + bars */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-6">
              <div className="mb-2 flex items-center gap-2 label-eyebrow">
                <TrendingUp className="h-4 w-4" />{t("skills.overall")}
              </div>
              <div className="flex items-end gap-1">
                <span className="display text-5xl">{readiness}</span>
                <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
              </div>
            </Card>
            <Card className="p-6">
              <div className="mb-2 flex items-center gap-2 label-eyebrow">
                <ArrowUp className="h-4 w-4" />{t("skills.improved")}
              </div>
              <div className="flex items-end gap-1">
                <span className="display text-5xl">{improved}</span>
                <span className="mb-2 text-sm text-muted-foreground">/ {abilities.length}</span>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2 label-eyebrow">
              <RadarIcon className="h-4 w-4" />{t("skills.dimensions")}
            </div>
            <div className="space-y-4">
              {abilities.map((s) => (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {s.delta !== 0 && (
                        <span className={cn("flex items-center gap-0.5 text-xs font-medium",
                          s.delta > 0 ? "text-success" : "text-muted-foreground")}>
                          {s.delta > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(s.delta)}
                        </span>
                      )}
                      <span className="tabular-nums">{s.current}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-foreground transition-smooth" style={{ width: `${s.current}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">{t("skills.deltaNote")}</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Skills;
