import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { ArrowUp, Radar as RadarIcon, ArrowRight, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { SkillBars } from "@/components/SkillBars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { store } from "@/lib/workspaceStore";

const Skills = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const skills = useMemo(() => store.getSkills(), []);

  const chartData = skills.map((s) => ({ name: t(`skill.${s.key}`), score: s.current }));
  const readiness = Math.round(skills.reduce((s, x) => s + x.current, 0) / skills.length);
  const improved = skills.filter((s) => s.delta > 0).length;

  return (
    <AppLayout activePath="/skills">
      <PageHeader
        eyebrow={t("skills.eyebrow")}
        title={t("skills.title")}
        description={t("skills.subtitle")}
        actions={
          <Button onClick={() => navigate("/plan")} variant="outline" className="rounded-full">
            {t("skills.toPlan")}<ArrowRight className="ml-1 h-4 w-4" />
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
                <span className="mb-2 text-sm text-muted-foreground">/ {skills.length}</span>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2 label-eyebrow">
              <RadarIcon className="h-4 w-4" />{t("skills.dimensions")}
            </div>
            <SkillBars skills={skills} />
            <p className="mt-5 text-xs text-muted-foreground">{t("skills.deltaNote")}</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Skills;
