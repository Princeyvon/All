import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  Clock,
  Volume2,
  ChevronRight,
  ListTodo,
  Check,
  CornerDownLeft
} from "lucide-react";

export function VoiceAssistantDropdown({
  isOpen,
  onClose,
  activeContext = "Georgetown · Fall 2026",
  onExecuteInstruction,
  isExecuting = false,
  lastExecutionResult = null,
}) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [micPermissionError, setMicPermissionError] = useState("");
  const [localFeedback, setLocalFeedback] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Quick suggestion chips based on user context
  const quickSuggestions = [
    "Coach, prioritize my day",
    "Add Q1 urgent: Bank Runs case study due tomorrow",
    "Schedule Q2 deep work: Econ growth models",
    "Mark Setup checklist done",
    "Log 45 min strength workout",
    "Log weight as 74.2 kg",
    "Go to Georgetown",
  ];

  // Speech Recognition setup
  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setLocalFeedback(null);
      setText("");
    }
  }, [isOpen]);

  function cleanupRecording() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setRecordingElapsed(0);
  }

  async function startRecording() {
    setMicPermissionError("");
    setLocalFeedback(null);
    audioChunksRef.current = [];

    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setText(currentTranscript);
        };

        recognition.onerror = (event) => {
          if (event.error !== "no-speech" && event.error !== "aborted") {
            console.warn("Speech recognition warning:", event.error);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("SpeechRecognition initiation failed:", e);
      }
    }

    // Capture audio stream for preview
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            setAudioBlobUrl(url);
          }
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start(250);
      } catch (err) {
        console.warn("Microphone access:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setMicPermissionError("Microphone permission was denied. You can type instructions directly below.");
        }
      }
    }

    setIsRecording(true);
    setRecordingElapsed(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingElapsed((prev) => prev + 1);
    }, 1000);
  }

  function stopRecordingAndExecute() {
    cleanupRecording();
    // Auto execute if there is transcript text
    setTimeout(() => {
      if (text.trim()) {
        handleExecute(text.trim());
      }
    }, 300);
  }

  async function handleExecute(instructionText) {
    const query = (instructionText || text).trim();
    if (!query) return;

    // Call execution handler
    if (onExecuteInstruction) {
      const result = await onExecuteInstruction(query);
      if (result) {
        setLocalFeedback(result);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-4 sm:right-6 top-16 sm:top-20 z-50 w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-[#FFFEFA] border border-stone-200 shadow-2xl p-5 text-stone-900 animate-in fade-in slide-in-from-top-3 duration-200"
      role="dialog"
      aria-label="Voice Assistant Dropdown"
    >
      {/* Header bar */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2F745C]/10 text-[#2F745C] flex items-center justify-center">
            <Mic size={17} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">Voice Assistant</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#2F745C] bg-[#B9EAD8]/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F745C] animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-stone-500 truncate max-w-[220px]">
              Context: {activeContext}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Interactive Recording / Speaking Box */}
      <div className="mt-4 space-y-3">
        {/* Animated Microphone & Soundwave Zone */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isRecording
              ? "bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-200/50"
              : "bg-stone-50/70 border-stone-200/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-rose-600 font-black">Listening ({recordingElapsed}s)</span>
                </>
              ) : (
                "Say or type an instruction"
              )}
            </span>

            {/* Quick Action Button to Start/Stop */}
            <button
              type="button"
              onClick={isRecording ? stopRecordingAndExecute : startRecording}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
                isRecording
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-[#2F745C] text-white hover:brightness-110"
              }`}
            >
              {isRecording ? (
                <>
                  <Square size={13} fill="currentColor" /> Stop & Run
                </>
              ) : (
                <>
                  <Mic size={13} /> Speak Now
                </>
              )}
            </button>
          </div>

          {/* Equalizer animation when recording */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-6 my-2">
              {[40, 70, 90, 60, 100, 75, 45, 80, 65, 95, 50, 85].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-[#2F745C] rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(20, (h * (recordingElapsed % 3 + 1)) % 100)}%`,
                    animationDelay: `${idx * 80}ms`,
                    animationDuration: "500ms",
                  }}
                />
              ))}
            </div>
          )}

          {/* Transcript input box */}
          <div className="relative">
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 'Mark project ideas as done', 'Add assignment for Economic Development', or 'Log weight 74kg'..."
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-[#2F745C] resize-none"
            />
          </div>

          {micPermissionError && (
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <AlertCircle size={13} /> {micPermissionError}
            </p>
          )}

          {/* Audio preview if available */}
          {audioBlobUrl && !isRecording && (
            <div className="mt-2 flex items-center gap-2">
              <audio src={audioBlobUrl} controls className="h-8 w-full rounded-lg" />
            </div>
          )}

          {/* Execution action bar */}
          <div className="flex items-center justify-between pt-2 mt-1">
            <button
              type="button"
              onClick={() => {
                setText("");
                setLocalFeedback(null);
              }}
              className="text-[11px] text-stone-400 hover:text-stone-600 font-semibold"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={isExecuting || !text.trim()}
              onClick={() => handleExecute(text)}
              className="px-4 py-2 rounded-xl bg-[#11120F] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-stone-800 disabled:opacity-40 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" /> Executing...
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-[#B9EAD8]" /> Execute Instruction
                  <CornerDownLeft size={11} className="text-stone-400 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Execution Feedback Result (Confirmation Card) */}
        {(localFeedback || lastExecutionResult) && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Executed Successfully
                  </h4>
                  {(localFeedback?.quadrant || lastExecutionResult?.quadrant) && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700 text-white font-mono">
                      {localFeedback?.quadrant || lastExecutionResult?.quadrant} · {localFeedback?.priority || lastExecutionResult?.priority || "P2"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-800 mt-0.5 font-medium leading-relaxed">
                  {localFeedback?.message || lastExecutionResult?.message || "Action updated across your dashboard."}
                </p>
                {(localFeedback?.coachInsight || lastExecutionResult?.coachInsight) && (
                  <div className="mt-2 p-2 rounded-xl bg-white/80 border border-emerald-200/70 text-[11px] text-emerald-950">
                    <span className="font-bold text-emerald-800 block text-[10px] uppercase tracking-wider mb-0.5">Coach Insight</span>
                    {localFeedback?.coachInsight || lastExecutionResult?.coachInsight}
                  </div>
                )}
                {localFeedback?.actionDetail && (
                  <p className="text-[11px] text-emerald-700/80 mt-1.5 font-mono">
                    {localFeedback.actionDetail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div>
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Quick Instructions (Tap to run)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setText(suggestion);
                  handleExecute(suggestion);
                }}
                className="text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 hover:text-stone-900 px-2.5 py-1.5 rounded-xl transition-all border border-stone-200/50 flex items-center gap-1 active:scale-95 cursor-pointer text-left"
              >
                <span>{suggestion}</span>
                <ArrowRight size={10} className="text-stone-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
