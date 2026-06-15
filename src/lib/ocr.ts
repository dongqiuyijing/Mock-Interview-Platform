import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
// Vite-friendly worker import.
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const OCR_LANGS = "eng+chi_sim";

/**
 * Recognize text (English + Simplified Chinese) from an image file using the
 * browser-side Tesseract engine. No backend or API key required.
 */
export async function recognizeImage(
  file: File | Blob,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { data } = await Tesseract.recognize(file, OCR_LANGS, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });
  return data.text.trim();
}

// Render a single PDF page to a PNG blob, used when the page has no text layer
// (i.e. a scanned resume) so we can OCR it.
async function renderPageToBlob(
  page: pdfjsLib.PDFPageProxy,
): Promise<Blob | null> {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/**
 * Extract text from a PDF. First tries the embedded text layer; if a page has
 * little/no text (scanned document) it falls back to OCR on a rendered image.
 */
export async function extractPdfText(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ")
      .trim();

    if (pageText.replace(/\s/g, "").length >= 20) {
      parts.push(pageText);
    } else {
      // Scanned page — render and OCR it.
      const blob = await renderPageToBlob(page);
      if (blob) parts.push(await recognizeImage(blob));
    }
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }

  return parts.join("\n").trim();
}

/**
 * Extract text from a resume/JD file. Supports PDF and common image formats.
 * Returns the recognized text, or throws on unsupported type.
 */
export async function extractFileText(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractPdfText(file, onProgress);
  }
  if (file.type.startsWith("image/")) {
    return recognizeImage(file, onProgress);
  }
  throw new Error("unsupported");
}
