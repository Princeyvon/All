import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Trophy,
  Check,
  Plus,
  Minus,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
  Dumbbell,
  Flame,
  Clock,
  Sparkles,
  RotateCcw
} from "lucide-react";

export function WorkoutSplitSubpage({
  split,
  liftLog = [],
  onClose,
  onFinishWorkout,
  onSaveExerciseWeight,
}) {
  // Find previous weight for an exercise from liftLog
  function getPreviousWeight(exerciseName) {
    const history = liftLog
      .filter((l) => l.exercise?.toLowerCase() === exerciseName.toLowerCase() && l.load)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    if (history.length > 0) {
      return Number(history[0].load);
    }
    return null;
  }

  // State: weights logged for each exercise for this session
  const [exerciseWeights, setExerciseWeights] = useState(() => {
    const initial = {};
    split.exercises.forEach((ex) => {
      const prev = getPreviousWeight(ex.name);
      initial[ex.id] = prev !== null ? prev : ex.defaultLoad;
    });
    return initial;
  });

  // Sound enabled toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  function playBeep(freq, dur, vol = 0.15) {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      // Audio fallback
    }
  }

  function vibrate(pattern) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // Build timeline steps
  const steps = useMemo(() => {
    const arr = [];
    arr.push({
      type: "warmup",
      duration: split.warmupSec || 300,
      label: "Warm-up",
      cue: split.warmupCue || "Arm circles, band pull-aparts, light cardio",
    });

    split.exercises.forEach((ex, exIdx) => {
      for (let s = 0; s < split.setsPerExercise; s++) {
        arr.push({
          type: "work",
          exIdx,
          setIdx: s,
          duration: split.workSec,
          label: ex.name,
          cue: ex.cue,
          exercise: ex,
        });
        if (s < split.setsPerExercise - 1) {
          arr.push({
            type: "rest",
            exIdx,
            setIdx: s,
            duration: split.restBetweenSets,
            label: ex.name,
            cue: "Catch your breath, shake it out, prepare for the next set",
            exercise: ex,
          });
        }
      }
      if (exIdx < split.exercises.length - 1) {
        const nextEx = split.exercises[exIdx + 1];
        arr.push({
          type: "restEx",
          exIdx,
          duration: split.restBetweenExercises,
          label: "Rest & Transition",
          cue: `Set up for: ${nextEx.name}`,
          nextName: nextEx.name,
          exercise: ex,
        });
      }
    });

    arr.push({
      type: "cooldown",
      duration: split.cooldownSec || 180,
      label: "Cool-down",
      cue: split.cooldownCue || "Full stretch, deep breathing, lower heart rate",
    });

    return arr;
  }, [split]);

  // Screen modes: "start" | "workout" | "finish"
  const [screen, setScreen] = useState("start");
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(steps[0]?.duration * 1000 || 60000);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [elapsedTotalMs, setElapsedTotalMs] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentStep = steps[stepIndex] || steps[0];

  // Timing loop
  const lastTsRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!isRunning || screen !== "workout") {
      lastTsRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    function loop(ts) {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      setRemainingMs((prev) => {
        const nextMs = prev - dt;
        setElapsedTotalMs((tot) => tot + dt);

        if (nextMs <= 0) {
          handleStepComplete();
          return 0;
        }

        // 3-2-1 Audio beep
        const secLeft = Math.ceil(nextMs / 1000);
        const prevSecLeft = Math.ceil((nextMs + dt) / 1000);
        if (secLeft <= 3 && secLeft >= 1 && prevSecLeft !== secLeft) {
          playBeep(secLeft === 1 ? 880 : 660, 0.14, 0.2);
        }

        return nextMs;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, screen, stepIndex]);

  function handleStepComplete() {
    const finished = steps[stepIndex];
    if (finished.type === "work") {
      setCompletedSets((c) => c + 1);
      vibrate([40]);
      playBeep(520, 0.22, 0.2);
    } else {
      vibrate([20, 60, 20]);
      playBeep(880, 0.22, 0.2);
    }

    if (stepIndex >= steps.length - 1) {
      triggerFinishWorkout();
      return;
    }

    const nextIdx = stepIndex + 1;
    setStepIndex(nextIdx);
    setRemainingMs(steps[nextIdx].duration * 1000);
    lastTsRef.current = null;
  }

  function triggerFinishWorkout() {
    setIsRunning(false);
    setScreen("finish");
    playBeep(660, 0.2, 0.2);
    setTimeout(() => playBeep(880, 0.25, 0.2), 180);
    setTimeout(() => playBeep(1040, 0.35, 0.25), 360);

    // Prepare lifts for saving
    const logsToSave = split.exercises.map((ex) => ({
      id: Date.now() + Math.random(),
      exercise: ex.name,
      load: Number(exerciseWeights[ex.id] ?? ex.defaultLoad),
      unit: "kg",
      reps: 10,
      sets: split.setsPerExercise,
      note: `${split.title} session`,
    }));

    if (onFinishWorkout) {
      const minutes = Math.round(elapsedTotalMs / 60000) || split.estimatedMin;
      onFinishWorkout({
        title: split.title,
        duration: `${minutes} min`,
        exercisesCompleted: split.exercises.length,
        setsCompleted: completedSets + 1,
        lifts: logsToSave,
      });
    }
  }

  function startWorkout() {
    setScreen("workout");
    setStepIndex(0);
    setRemainingMs(steps[0].duration * 1000);
    setElapsedTotalMs(0);
    setCompletedSets(0);
    setIsRunning(true);
    playBeep(660, 0.25, 0.2);
  }

  function togglePlayPause() {
    setIsRunning(!isRunning);
    lastTsRef.current = null;
  }

  function handleNextStep() {
    if (stepIndex < steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setRemainingMs(steps[nextIdx].duration * 1000);
      lastTsRef.current = null;
    } else {
      triggerFinishWorkout();
    }
  }

  function handlePrevStep() {
    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      setRemainingMs(steps[prevIdx].duration * 1000);
      lastTsRef.current = null;
    }
  }

  function updateWeight(exId, delta) {
    setExerciseWeights((prev) => {
      const curr = Number(prev[exId] || 0);
      const updated = Math.max(0, Math.round((curr + delta) * 10) / 10);
      return { ...prev, [exId]: updated };
    });
  }

  function setDirectWeight(exId, value) {
    const num = parseFloat(value);
    setExerciseWeights((prev) => ({
      ...prev,
      [exId]: isNaN(num) ? "" : Math.max(0, num),
    }));
  }

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  // Ring geometry
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const currentDurationMs = (currentStep?.duration || 60) * 1000;
  const progressRatio = Math.max(0, Math.min(1, 1 - remainingMs / currentDurationMs));
  const strokeOffset = circumference * (1 - progressRatio);

  // Phase color selection
  const phaseColors = {
    warmup: { color: "#A78BFA", label: "Warm-up" },
    work: { color: "#FF5C3E", label: "Work" },
    rest: { color: "#2DD4BF", label: "Rest" },
    restEx: { color: "#2DD4BF", label: "Rest" },
    cooldown: { color: "#FBBF24", label: "Cool-down" },
  };
  const activePhase = phaseColors[currentStep?.type] || phaseColors.work;

  // Segment index
  function getSegmentIndex(step) {
    if (step.type === "warmup") return 0;
    if (step.type === "cooldown") return split.exercises.length + 1;
    return 1 + (step.exIdx || 0);
  }
  const totalSegments = split.exercises.length + 2;
  const currentSegIdx = getSegmentIndex(currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center sm:p-4 p-0 animate-in fade-in duration-200">
      {/* Container card: fixed height bounds so header & footer stay pinned, zero overlapping */}
      <div className="w-full max-w-2xl h-full sm:h-[92vh] sm:max-h-[860px] bg-[#16171E] text-stone-100 sm:rounded-3xl border sm:border-stone-800 shadow-2xl flex flex-col overflow-hidden relative">

        {/* =========================================================================
            SCREEN 1: OVERVIEW & EXERCISE WEIGHT LOGGING
            ========================================================================= */}
        {screen === "start" && (
          <>
            {/* Pinned Top Navigation */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-stone-800/80 bg-[#16171E] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-xl hover:bg-stone-800"
              >
                <ArrowLeft size={15} /> Back
              </button>

              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: split.bgTint,
                    borderColor: split.borderTint,
                    color: split.color,
                  }}
                >
                  {split.badge}
                </span>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Main Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {/* Header Details */}
              <div className="pb-3 border-b border-stone-800/60">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {split.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                  {split.subtitle} · <span className="text-stone-300 font-medium">{split.focus}</span>
                </p>

                {/* Meta Highlights Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-400 mt-2.5">
                  <span>
                    <strong className="text-white font-bold">{split.exercises.length}</strong> exercises
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-white font-bold">{split.setsPerExercise}</strong> sets each
                  </span>
                  <span>•</span>
                  <span>
                    ~<strong className="text-white font-bold">{split.estimatedMin}</strong> min total
                  </span>
                  <span>•</span>
                  <span className="text-teal-400 font-semibold">
                    66s work / 60s rest
                  </span>
                </div>

                {/* Phase interval legend */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-stone-800/40 text-[11px] text-stone-300">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" /> Warm-up (5m)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3E]" /> Work (66s)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" /> Rest (60s)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" /> Cool-down (3m)
                  </span>
                </div>
              </div>

              {/* Routine Exercises Header */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Exercise Routine & Target Weights
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Set your weights before starting. They will be saved to your lift history when done.
                  </p>
                </div>
              </div>

              {/* Exercises List */}
              <div className="space-y-3">
                {split.exercises.map((ex, i) => {
                  const prevWeight = getPreviousWeight(ex.name);
                  const currentWeight = exerciseWeights[ex.id] ?? ex.defaultLoad;
                  const hasPrev = prevWeight !== null;
                  const delta = hasPrev ? currentWeight - prevWeight : null;

                  return (
                    <div
                      key={ex.id}
                      className="bg-[#20222A] border border-stone-800/90 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all hover:border-stone-700"
                    >
                      {/* Top: Exercise name & muscle */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-bold text-stone-300 shrink-0">
                            {i + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white tracking-tight truncate">
                            {ex.name}
                          </h3>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-800 text-teal-300 border border-stone-700 shrink-0">
                          {ex.muscle}
                        </span>
                      </div>

                      {/* Technique Cue */}
                      <p className="text-xs text-stone-400 leading-relaxed pl-8 -mt-1">
                        {ex.cue}
                      </p>

                      {/* Bottom Weight & Progress Controls: clean non-overlapping row */}
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2 border-t border-stone-800/80 bg-stone-900/40 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-2xl">
                        {/* Previous weight & delta pill */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-stone-400 shrink-0">
                            Previous:{" "}
                            <strong className="text-stone-200 font-semibold">
                              {hasPrev ? `${prevWeight} kg` : "None"}
                            </strong>
                          </span>

                          {hasPrev && (
                            <span
                              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                                delta > 0
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : delta === 0
                                  ? "bg-stone-800 text-stone-300"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              <TrendingUp size={10} />
                              {delta > 0
                                ? `+${delta.toFixed(1)} kg`
                                : delta === 0
                                ? "= Best"
                                : `${delta.toFixed(1)} kg`}
                            </span>
                          )}
                        </div>

                        {/* Stepper with explicit sizes */}
                        <div className="flex items-center gap-1.5 self-end xs:self-auto">
                          <span className="text-[11px] text-stone-400 mr-1 hidden sm:inline">Target:</span>
                          <button
                            type="button"
                            onClick={() => updateWeight(ex.id, -2.5)}
                            aria-label={`Decrease weight for ${ex.name}`}
                            className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 hover:bg-stone-700 text-white flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>

                          <div className="flex items-center bg-stone-950 border border-stone-700 rounded-lg px-2 h-7">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={currentWeight === "" ? "" : currentWeight}
                              onChange={(e) => setDirectWeight(ex.id, e.target.value)}
                              className="w-12 text-center font-bold text-xs bg-transparent text-white tabular-nums focus:outline-none"
                            />
                            <span className="text-[10px] font-semibold text-stone-400">kg</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateWeight(ex.id, 2.5)}
                            aria-label={`Increase weight for ${ex.name}`}
                            className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 hover:bg-stone-700 text-white flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pinned Bottom CTA Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-800 bg-[#16171E] shrink-0">
              <button
                type="button"
                onClick={startWorkout}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#FF5C3E] text-[#11120F] hover:brightness-110 active:scale-[0.99] font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C3E]/20 transition-all cursor-pointer"
              >
                <Play size={18} fill="#11120F" /> Start 56-Min Workout
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            SCREEN 2: ACTIVE WORKOUT TIMER (CLEAN & NON-OVERLAPPING)
            ========================================================================= */}
        {screen === "workout" && (
          <div className="h-full flex flex-col justify-between">
            {/* Pinned Top Bar */}
            <div className="px-4 sm:px-6 py-3 border-b border-stone-800/80 bg-[#16171E] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(true)}
                  className="text-xs font-bold text-stone-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-stone-800 flex items-center gap-1 transition-colors"
                >
                  ✕ Exit
                </button>

                <div className="text-center min-w-0 px-2">
                  <div className="text-xs font-extrabold text-white truncate">
                    {currentStep.type === "warmup" && "Warm-up Phase"}
                    {currentStep.type === "cooldown" && "Cool-down Phase"}
                    {(currentStep.type === "work" || currentStep.type === "rest") && (
                      <>
                        Ex {(currentStep.exIdx || 0) + 1}/{split.exercises.length} · Set {(currentStep.setIdx || 0) + 1}/{split.setsPerExercise}
                      </>
                    )}
                    {currentStep.type === "restEx" && "Next Exercise Transition"}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    Total: {formatTime(elapsedTotalMs)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              {/* Segmented Timeline Progress Bar */}
              <div className="flex gap-1 mt-2.5">
                {Array.from({ length: totalSegments }).map((_, idx) => {
                  const isComplete = idx < currentSegIdx;
                  const isCurrent = idx === currentSegIdx;
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-1.5 rounded-full bg-stone-800 overflow-hidden relative"
                    >
                      {isComplete && <div className="h-full w-full bg-teal-400" />}
                      {isCurrent && (
                        <div
                          className="h-full bg-[#FF5C3E] transition-all duration-200"
                          style={{ width: `${progressRatio * 100}%` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Central Timer Stage: Compact & Fluid */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none overflow-y-auto">
              {/* Phase Pill */}
              <div
                className="text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 inline-flex items-center gap-1.5 transition-colors"
                style={{
                  color: activePhase.color,
                  backgroundColor: `${activePhase.color}18`,
                  border: `1px solid ${activePhase.color}40`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: activePhase.color }}
                />
                {activePhase.label}
              </div>

              {/* Circular Ring Timer */}
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center my-1">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    className="text-stone-800"
                    strokeWidth="7"
                    stroke="currentColor"
                    fill="none"
                  />
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    stroke={activePhase.color}
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-200"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight tabular-nums text-white">
                    {formatTime(remainingMs)}
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-stone-400 mt-1 font-semibold">
                    {activePhase.label.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Active Exercise Label & Cue */}
              <div className="mt-3 max-w-md px-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  {currentStep.label}
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {currentStep.cue}
                </p>
              </div>

              {/* In-Workout Load Ticker (if step is an exercise) */}
              {currentStep.exercise && (
                <div className="mt-3 inline-flex items-center gap-2 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
                  <Dumbbell size={14} className="text-[#FF5C3E]" />
                  <span className="text-xs text-stone-400">Load:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateWeight(currentStep.exercise.id, -2.5)}
                      className="w-6 h-6 rounded-md bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center text-xs"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="font-extrabold text-white text-xs tabular-nums px-1.5">
                      {exerciseWeights[currentStep.exercise.id] ?? currentStep.exercise.defaultLoad} kg
                    </span>
                    <button
                      type="button"
                      onClick={() => updateWeight(currentStep.exercise.id, 2.5)}
                      className="w-6 h-6 rounded-md bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center text-xs"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  {getPreviousWeight(currentStep.exercise.name) !== null && (
                    <span className="text-[11px] text-teal-400 font-semibold border-l border-stone-800 pl-2">
                      Prev: {getPreviousWeight(currentStep.exercise.name)}kg
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Pinned Bottom Controls Bar */}
            <div className="px-4 sm:px-6 py-4 border-t border-stone-800 bg-[#16171E] shrink-0 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={handlePrevStep}
                aria-label="Previous step"
                className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 hover:bg-stone-700 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <SkipBack size={18} />
              </button>

              <button
                type="button"
                onClick={togglePlayPause}
                aria-label={isRunning ? "Pause workout" : "Play workout"}
                className="w-16 h-16 rounded-full bg-[#FF5C3E] text-[#11120F] hover:brightness-110 flex items-center justify-center shadow-lg shadow-[#FF5C3E]/30 transition-all active:scale-95 cursor-pointer"
              >
                {isRunning ? (
                  <Pause size={24} fill="#11120F" />
                ) : (
                  <Play size={24} fill="#11120F" className="ml-1" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                aria-label="Skip to next step"
                className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 hover:bg-stone-700 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Exit Confirmation Dialog */}
            {showExitConfirm && (
              <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1C1E26] border border-stone-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
                  <h3 className="text-lg font-bold text-white">Leave workout?</h3>
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    You are in an active workout session. If you exit now, this session will not be saved to your logs.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowExitConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-stone-800 text-white font-semibold text-xs hover:bg-stone-700"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExitConfirm(false);
                        setIsRunning(false);
                        setScreen("start");
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold text-xs hover:bg-rose-500/30"
                    >
                      Exit Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: FINISH CELEBRATION & PROGRESS SUMMARY
            ========================================================================= */}
        {screen === "finish" && (
          <div className="h-full flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-stone-800 bg-[#16171E] shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Session Finished
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Summary */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
                <Trophy size={32} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {split.title} Done!
              </h2>
              <p className="text-stone-400 text-xs mt-1 max-w-sm">
                Every set completed. Weights and volume have been recorded directly to your dashboard.
              </p>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-5">
                <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-2xl text-center">
                  <span className="text-xl font-black text-white font-mono tabular-nums">
                    {formatTime(elapsedTotalMs)}
                  </span>
                  <span className="block text-[10.5px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
                    Total Time
                  </span>
                </div>
                <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-2xl text-center">
                  <span className="text-xl font-black text-teal-400 font-mono tabular-nums">
                    {split.exercises.length * split.setsPerExercise}
                  </span>
                  <span className="block text-[10.5px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
                    Sets Logged
                  </span>
                </div>
              </div>

              {/* Exercise Weights & Progress Delta Breakdown */}
              <div className="w-full max-w-sm mt-5 text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
                  Recorded Exercise Weights
                </h4>
                <div className="bg-stone-900 border border-stone-800 rounded-2xl divide-y divide-stone-800 overflow-hidden">
                  {split.exercises.map((ex) => {
                    const logged = exerciseWeights[ex.id] ?? ex.defaultLoad;
                    const prev = getPreviousWeight(ex.name);
                    const diff = prev !== null ? logged - prev : null;

                    return (
                      <div key={ex.id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-white truncate">{ex.name}</p>
                          <p className="text-stone-400 text-[11px]">
                            {prev !== null ? `Previous: ${prev} kg` : "First session"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-white text-sm tabular-nums">
                            {logged} kg
                          </span>
                          {diff !== null && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                diff > 0
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : diff === 0
                                  ? "bg-stone-800 text-stone-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {diff > 0 ? `+${diff.toFixed(1)} kg` : diff === 0 ? "=" : `${diff.toFixed(1)} kg`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pinned Bottom Buttons */}
            <div className="p-4 sm:p-5 border-t border-stone-800 bg-[#16171E] shrink-0 flex flex-col gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-teal-400 text-[#11120F] font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-teal-400/20"
              >
                Done & Return to Fitness
              </button>
              <button
                type="button"
                onClick={() => {
                  setScreen("start");
                  setStepIndex(0);
                  setRemainingMs(steps[0].duration * 1000);
                }}
                className="w-full py-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
              >
                Repeat Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
