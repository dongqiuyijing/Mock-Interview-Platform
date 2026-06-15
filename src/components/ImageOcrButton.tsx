import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractFileText } from "@/lib/ocr";
import { toast } from "sonner";

interface ImageOcrButtonProps {
  /** Called with the recognized text so the parent can append it. */
  onText: (text: string) => void;
}

// Extracts text from an uploaded resume/JD file (PDF or image), fully in the
// browser — no backend or API key required.
export const ImageOcrButton = ({ onText }: ImageOcrButtonProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!file.type.startsWith("image/") && !isPdf) {
      toast.error(t("ocr.error.type"));
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const text = await extractFileText(file, setProgress);
      if (!text) {
        toast.error(t("ocr.error.empty"));
        return;
      }
      onText(text);
      toast.success(t("ocr.success"));
    } catch {
      toast.error(t("ocr.error.fail"));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" size="sm" disabled={busy}
        onClick={() => inputRef.current?.click()} className="rounded-full">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            {t("ocr.working", { progress })}
          </>
        ) : (
          <>
            <FileUp className="mr-2 h-3.5 w-3.5" />
            {t("ocr.upload")}
          </>
        )}
      </Button>
    </>
  );
};
