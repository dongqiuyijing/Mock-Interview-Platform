import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { ResumePickerDialog } from "@/components/ResumePickerDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Resume, listResumes, deleteResume, getResumeSignedUrl,
} from "@/lib/resumes";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

const ResumesPage = () => {
  const { t, i18n } = useTranslation();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = () => {
    setLoading(true);
    listResumes()
      .then(setResumes)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (r: Resume) => {
    try {
      await deleteResume(r.id, r.image_path);
      toast.success(t("resumes.deleted"));
      setResumes((list) => list.filter((x) => x.id !== r.id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const openImage = async (r: Resume) => {
    if (!r.image_path) return;
    const url = await getResumeSignedUrl(r.image_path);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <AppLayout activePath="/resumes">
      <ResumePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={load} />

      <PageHeader
        eyebrow={t("nav.resumes")}
        title={t("resumes.page.title")}
        description={t("resumes.page.subtitle")}
        actions={
          <Button onClick={() => setPickerOpen(true)} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />{t("resumes.add")}
          </Button>
        }
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        </div>
      ) : resumes.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-14 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("resumes.empty")}</p>
          <Button onClick={() => setPickerOpen(true)} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />{t("resumes.add")}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {resumes.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(r.created_at, i18n.language)}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {r.image_path && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground"
                    onClick={() => openImage(r)} title={t("resumes.view")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(r)} title={t("resumes.delete")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default ResumesPage;
