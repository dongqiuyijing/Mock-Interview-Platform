import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageOcrButtonProps {
  /** Called with the recognized text so the parent can append it. */
  onText: (text: string) => void;
}

// Recognizes both English and Simplified Chinese from an uploaded image,
// fully in the browser — no backend, API key or upload required.
export const ImageOcrButton = ({ onText }: ImageOcrButtonProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("ocr.error.type"));
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const { data } = await Tesseract.recognize(file, "eng+chi_sim", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const text = data.text.trim();
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
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" size="sm" disabled={busy}
        onClick={() => inputRef.current?.click()} className="rounded-full">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            {t("ocr.working", { progress })}
          </>
        ) : (
          <>
            <ImagePlus className="mr-2 h-3.5 w-3.5" />
            {t("ocr.upload")}
          </>
        )}
      </Button>
    </>
  );
};
