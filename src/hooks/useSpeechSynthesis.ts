import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Text-to-speech via the browser's built-in Web Speech API
 * (`window.speechSynthesis`). No plugin or external service required — it runs
 * locally and is free. Used to give the AI interviewer a voice.
 */
interface Options {
  lang?: string;
}

export function useSpeechSynthesis({ lang = "en-US" }: Options = {}) {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Voices load asynchronously in most browsers.
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      // Stop anything already queued so questions don't overlap.
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 1;
      utter.pitch = 1;

      // Prefer a voice that matches the requested language.
      const prefix = lang.split("-")[0];
      const match =
        voicesRef.current.find((v) => v.lang === lang) ??
        voicesRef.current.find((v) => v.lang.startsWith(prefix));
      if (match) utter.voice = match;

      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utter);
    },
    [supported, lang],
  );

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, speak, cancel };
}
