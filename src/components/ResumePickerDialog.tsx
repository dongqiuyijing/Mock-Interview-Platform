import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, FileUp, Loader2, Check, PlusCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Resume, listResumes, createResume } from "@/lib/resumes";
import { extractFileText } from "@/lib/ocr";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ResumePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user picks (or uploads) a resume to use. */
  onSelect: (resume: Resume) => void;
}

export const ResumePickerDialog = ({ open, onOpenChange, onSelect }: ResumePickerDialogProps) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);

  // upload sub-state
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetUpload = () => {
    setFile(null);
    setName("");
    setContent("");
    setProgress(0);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listResumes()
      .then(setResumes)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
    resetUpload();
  }, [open]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!f.type.startsWith("image/") && !isPdf) {
      toast.error(t("ocr.error.type"));
      return;
    }
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));
    setOcrBusy(true);
    setProgress(0);
    try {
      const text = await extractFileText(f, setProgress);
      if (!text) {
        toast.error(t("ocr.error.empty"));
        return;
      }
      setContent(text);
    } catch {
      toast.error(t("ocr.error.fail"));
    } finally {
      setOcrBusy(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error(t("ocr.error.empty"));
      return;
    }
    if (!name.trim()) {
      toast.error(t("resumePicker.nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const resume = await createResume({ name: name.trim(), content, file });
      toast.success(t("resumes.saved"));
      onSelect(resume);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("resumePicker.title")}</DialogTitle>
          <DialogDescription>{t("resumePicker.desc")}</DialogDescription>
        </DialogHeader>

        {/* Existing resumes */}
        <div className="space-y-2">
          <div className="label-eyebrow">{t("resumePicker.existing")}</div>
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />{t("resumePicker.loading")}
            </div>
          ) : resumes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              {t("resumePicker.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {resumes.map((r) => (
                <button key={r.id} type="button"
                  onClick={() => { onSelect(r); onOpenChange(false); }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition-smooth hover:border-foreground/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium">{r.name}</span>
                  </div>
                  <Check className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload new */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="label-eyebrow">{t("resumePicker.uploadNew")}</div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />

          {!file ? (
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="w-full rounded-xl">
              <FileUp className="mr-2 h-4 w-4" />{t("resumePicker.chooseImage")}
            </Button>
          ) : (
            <div className="space-y-3">
              {ocrBusy ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />{t("resumePicker.recognizing", { progress })}
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("resumePicker.nameLabel")}</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)}
                      placeholder={t("resumePicker.namePh")} className="h-11 rounded-xl" />
                  </div>
                  <p className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={resetUpload} className="rounded-full">
                      {t("resumePicker.reselect")}
                    </Button>
                    <Button type="button" size="sm" onClick={handleSave} disabled={saving} className={cn("ml-auto rounded-full")}>
                      {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="mr-2 h-3.5 w-3.5" />}
                      {t("resumePicker.saveUse")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
