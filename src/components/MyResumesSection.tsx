import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2 } from "lucide-react";
import { Resume, listResumes, getResumeSignedUrl } from "@/lib/resumes";

// "My resumes" list shown in the sidebar. Reflects the current user's saved
// resumes; clicking one opens its stored image (if any) in a new tab.
export const MyResumesSection = ({ refreshKey }: { refreshKey?: number }) => {
  const { t } = useTranslation();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    listResumes()
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openImage = async (r: Resume) => {
    if (!r.image_path) return;
    const url = await getResumeSignedUrl(r.image_path);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <div className="mt-2 border-t border-border px-4 pt-4">
      <div className="label-eyebrow mb-2 px-3">{t("nav.resumes")}</div>
      {loading ? (
        <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : resumes.length === 0 ? (
        <p className="px-3 py-2.5 text-sm text-muted-foreground">{t("resumes.empty")}</p>
      ) : (
        <div className="space-y-1">
          {resumes.slice(0, 6).map((r) => (
            <button key={r.id} type="button" onClick={() => openImage(r)}
              title={r.name}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
