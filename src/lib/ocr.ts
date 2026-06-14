import Tesseract from "tesseract.js";

/**
 * Recognize text (English + Simplified Chinese) from an image file using the
 * browser-side Tesseract engine. No backend or API key required.
 * Shared by the JD OCR button and the resume upload flows.
 */
export async function recognizeImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { data } = await Tesseract.recognize(file, "eng+chi_sim", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });
  return data.text.trim();
}
