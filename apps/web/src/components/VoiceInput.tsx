"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
// @ts-expect-error lucide-react 0.400 types incomplete
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
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

  const createRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
      setInterimText("");
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 30000);
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

      setInterimText(interimTranscript);

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
        setInterimText("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setState("error");
      } else if (event.error !== "aborted") {
        setState("error");
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    recognition.onend = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setState("idle");
      setInterimText("");
    };

    return recognition;
  }, [onTranscript]);

  const toggleRecording = useCallback(() => {
    if (!isSupported) return;

    if (state === "listening") {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setState("processing");
    } else {
      recognitionRef.current = createRecognition();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setState("error");
        }
      }
    }
  }, [state, isSupported, createRecognition]);

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-zinc-500 ${className}`}>
        <MicOff size={20} />
        <span className="text-sm">Speech not supported</span>
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
        className={`
          relative flex items-center justify-center w-10 h-10 rounded-full
          transition-all duration-200 ease-in-out
          ${
            isActive
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : isProcessing
                ? "bg-amber-500/20 text-amber-400"
                : state === "error"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          }
        `}
        aria-label={isActive ? "Stop recording" : "Start recording"}
      >
        {isActive && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30" />
        )}
        {isProcessing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isActive ? (
          <Mic size={18} />
        ) : state === "error" ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
      </button>

      {isActive && (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-sm text-zinc-400">
            {interimText || "Listening..."}
          </span>
        </div>
      )}

      {state === "error" && (
        <span className="text-sm text-red-400">
          Microphone access denied or error occurred
        </span>
      )}
    </div>
  );
}
