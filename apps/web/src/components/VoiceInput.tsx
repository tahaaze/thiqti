"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

type RecordingState = "idle" | "listening" | "processing" | "error";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className = "" }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullTextRef = useRef("");
  const sentRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setErrorMessage(
        "La reconnaissance vocale n'est pas disponible. Utilisez Chrome ou Edge."
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const commitTranscript = useCallback(() => {
    const text = fullTextRef.current.trim();
    if (text && !sentRef.current) {
      sentRef.current = true;
      onTranscript(text);
    }
    fullTextRef.current = "";
  }, [onTranscript]);

  const createRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "ar-MA";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
      setErrorMessage("");
      fullTextRef.current = "";
      sentRef.current = false;
      timeoutRef.current = setTimeout(() => {
        recognition.stop();
      }, 20000);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        fullTextRef.current = (fullTextRef.current + " " + finalTranscript).trim();
        commitTranscript();
      }
      setInterimText(interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErrorMessage("Accès au micro refusé : autorisez le micro dans votre navigateur.");
        setState("error");
      } else if (event.error === "no-speech") {
        if (fullTextRef.current.trim()) commitTranscript();
        setInterimText("");
        setState("idle");
      } else if (event.error !== "aborted") {
        setErrorMessage("Erreur micro. Vérifiez votre micro et réessayez.");
        setState("error");
      }
    };

    recognition.onend = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fullTextRef.current.trim() && !sentRef.current) commitTranscript();
      setInterimText("");
      setState("idle");
    };

    return recognition;
  }, [commitTranscript]);

  const toggleRecording = useCallback(() => {
    if (!isSupported) return;

    if (state === "listening") {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setState("processing");
      return;
    }

    recognitionRef.current = createRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        setErrorMessage("Impossible de démarrer le micro. Réessayez.");
        setState("error");
      }
    }
  }, [state, isSupported, createRecognition]);

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-muted ${className}`} title={errorMessage}>
        <MicOff className="h-5 w-5" />
        <span className="text-xs">Micro indisponible</span>
      </div>
    );
  }

  const isActive = state === "listening";
  const isProcessing = state === "processing";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        type="button"
        aria-label={isActive ? "Arrêter" : "Parler"}
        title={isActive ? "Arrêter" : "Parler en français ou darija"}
        className={`
          relative flex items-center justify-center w-10 h-10 rounded-full
          transition-all duration-200 ease-in-out
          ${
            isActive
              ? "bg-red-500/20 text-red-600 hover:bg-red-500/30"
              : isProcessing
                ? "bg-amber-500/20 text-amber-600"
                : state === "error"
                  ? "bg-red-500/20 text-red-600"
                  : "bg-muted/10 text-ink hover:bg-muted/20"
          }
        `}
      >
        {isActive && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30" />
        )}
        {isProcessing ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : isActive ? (
          <Mic className="h-[18px] w-[18px]" />
        ) : state === "error" ? (
          <MicOff className="h-[18px] w-[18px]" />
        ) : (
          <Mic className="h-[18px] w-[18px]" />
        )}
      </button>

      {isActive && (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-sm text-muted">
            {interimText || "Je vous écoute... / سمعني..."}
          </span>
        </div>
      )}

      {state === "error" && errorMessage && (
        <span className="text-xs text-red-600">{errorMessage}</span>
      )}
    </div>
  );
}
