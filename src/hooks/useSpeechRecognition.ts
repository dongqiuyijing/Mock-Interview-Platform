import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal typings for the Web Speech API (not in the default TS lib).
 */
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: { length: number;[index: number]: SpeechRecognitionResult };
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

const getCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

interface Options {
  lang?: string;
  /** Called with newly finalized text segments. */
  onFinal?: (text: string) => void;
}

export function useSpeechRecognition({ lang = "en-US", onFinal }: Options = {}) {
  const supported = typeof window !== "undefined" && !!getCtor();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef(onFinal);
  const manualStopRef = useRef(false);

  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    manualStopRef.current = true;
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    // Tear down any previous instance.
    recRef.current?.abort();

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    manualStopRef.current = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) {
          onFinalRef.current?.(text);
        } else {
          live += text;
        }
      }
      setInterim(live);
    };
    rec.onerror = () => {
      setInterim("");
    };
    rec.onend = () => {
      setInterim("");
      // Auto-restart on unexpected end (e.g. silence timeout) unless the
      // user explicitly stopped.
      if (!manualStopRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      recRef.current?.abort();
    };
  }, []);

  return { supported, listening, interim, start, stop, toggle };
}
