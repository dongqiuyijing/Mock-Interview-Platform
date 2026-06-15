import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUp, FileText, Loader2, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createResume, getOnboarded, setOnboarded } from "@/lib/resumes";
import { extractFileText } from "@/lib/ocr";
import { toast } from "sonner";

interface OnboardingResumeDialogProps {
  /** Called after the user finishes (saved or skipped) so the parent can refresh. */
  onDone?: () => void;
}

// First-run onboarding: ask a brand-new user to upload their first resume.
// Skippable — they can add resumes later from "My resumes".
export const OnboardingResumeDialog = ({ onDone }: OnboardingResumeDialogProps) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOnboarded()
      .then((done) => setOpen(!done))
      .catch(() => setOpen(false));
  }, []);

  const finish = async () => {
    await setOnboarded(true);
    setOpen(false);
    onDone?.();
  };

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
      await createResume({ name: name.trim(), content, file });
      toast.success(t("onboarding.saved"));
      await finish();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) void finish(); }}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle>{t("onboarding.title")}</DialogTitle>
          <DialogDescription>{t("onboarding.desc")}</DialogDescription>
        </DialogHeader>

        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />

        {!file ? (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center transition-smooth hover:border-foreground/40">
            <FileUp className="h-7 w-7 text-muted-foreground" />
            <span className="text-sm font-medium">{t("onboarding.upload")}</span>
            <span className="text-xs text-muted-foreground">{t("onboarding.uploadHint")}</span>
          </button>
        ) : ocrBusy ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />{t("resumePicker.recognizing", { progress })}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("onboarding.nameLabel")}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t("onboarding.namePh")} className="h-11 rounded-xl" />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setContent(""); setName(""); }} className="rounded-full">
              {t("resumePicker.reselect")}
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={() => void finish()} className="rounded-full">
            {t("onboarding.skip")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!content.trim() || saving} className="rounded-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {t("onboarding.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
