import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";

// "My resumes" entry shown in the sidebar as a plain nav item, flush with the
// other navigation links (no divider, no list, no arrow).
export const MyResumesSection = (_props: { refreshKey?: number }) => {
  const { t } = useTranslation();
  return (
    <Link
      to="/resumes"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
    >
      <FileText className="h-4 w-4" />
      {t("nav.resumes")}
    </Link>
  );
};
