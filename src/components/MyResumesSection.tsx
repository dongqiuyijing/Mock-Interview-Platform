import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, ChevronRight } from "lucide-react";
import { Resume, listResumes } from "@/lib/resumes";

// "My resumes" list shown in the sidebar. Clicking the heading or any item
// navigates to the full "My resumes" management page.
export const MyResumesSection = ({
  refreshKey
}: {
  refreshKey?: number;
}) => {
  const {
    t
  } = useTranslation();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    listResumes().then(setResumes).catch(() => setResumes([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  return <div className="mt-2 border-t border-border px-4 pt-4">
      <Link to="/resumes" className="label-eyebrow mb-2 flex items-center justify-between px-3 transition-smooth hover:text-foreground">
        {t("nav.resumes")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
      {loading ? <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div> : resumes.length === 0 ? <Link to="/resumes" className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground">
          {t("resumes.empty")}
        </Link> : <div className="space-y-1">
          {resumes.slice(0, 6).map(r => <Link key={r.id} to="/resumes" title={r.name} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              
            </Link>)}
        </div>}
    </div>;
};