import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, FileText, ArrowRight, Loader2, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InterviewTask, dirKey, statusKey, typeKey } from "@/lib/interview";

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  created: "outline",
  analyzed: "secondary",
  interviewing: "default",
  completed: "default",
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<InterviewTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("interview_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTasks((data as InterviewTask[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container flex-1 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("dash.title")}</h1>
            <p className="mt-1 text-muted-foreground">{t("dash.subtitle")}</p>
          </div>
          <Button asChild className="shadow-glow">
            <Link to="/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("dash.new")}
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="mt-10 flex flex-col items-center justify-center border-dashed py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Briefcase className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t("dash.empty.title")}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("dash.empty.desc")}
            </p>
            <Button asChild className="mt-6">
              <Link to="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("dash.new")}
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="group flex flex-col p-5 transition-smooth hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={statusVariant[task.status] ?? "outline"}>
                    {t(statusKey(task.status))}
                  </Badge>
                </div>
                <h3 className="mt-4 line-clamp-1 font-semibold">{task.job_title}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-normal">
                    {t(dirKey(task.job_direction))}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {t(typeKey(task.interview_type))}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {task.jd_text}
                </p>
                <Button variant="ghost" asChild className="mt-4 justify-between">
                  <Link to={`/tasks/${task.id}/report`}>
                    {t("dash.open")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
