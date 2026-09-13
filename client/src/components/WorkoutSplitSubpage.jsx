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
  RotateCcw,
  Sliders,
  Edit2,
  Edit3,
  Target,
  Settings2,
} from "lucide-react";
import { TargetNumberInput } from "./TargetNumberInput";
import {
  WorkoutRoutineEditorModal,
  formatTimingBadge,
} from "./WorkoutRoutineEditorModal";

export function WorkoutSplitSubpage({
  split,
  liftLog = [],
  onClose,
  onFinishWorkout,
  onSaveExerciseWeight,
}) {
  // Local mutable split state with localStorage persistence
  const [activeSplit, setActiveSplit] = useState(() => {
    try {
      const saved = localStorage.getItem(`custom_workout_split_${split.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...split, ...parsed };
      }
    } catch (e) {}
    return split;
  });

  // Modal edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState("timings"); // "timings" | "routine"

  // Handle saving customized split
  const handleSaveCustomSplit = (updated) => {
    setActiveSplit(updated);
    try {
      localStorage.setItem(
        `custom_workout_split_${split.id}`,
        JSON.stringify(updated)
      );
    } catch (e) {}
    setShowEditModal(false);
  };

  // Reset to original split defaults
  const handleResetSplitDefaults = () => {
    try {
      localStorage.removeItem(`custom_workout_split_${split.id}`);
    } catch (e) {}
    setActiveSplit(split);
    setShowEditModal(false);
  };

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
    activeSplit.exercises.forEach((ex) => {
      const prev = getPreviousWeight(ex.name);
      initial[ex.id] = prev !== null ? prev : ex.defaultLoad;
    });
    return initial;
  });

  // Keep weights updated if new exercises are added
  useEffect(() => {
    setExerciseWeights((prev) => {
      const updated = { ...prev };
      activeSplit.exercises.forEach((ex) => {
        if (updated[ex.id] === undefined) {
          const prevWeight = getPreviousWeight(ex.name);
          updated[ex.id] = prevWeight !== null ? prevWeight : ex.defaultLoad;
        }
      });
      return updated;
    });
  }, [activeSplit.exercises]);

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

  // Build timeline steps dynamically from activeSplit
  const steps = useMemo(() => {
    const arr = [];
    arr.push({
      type: "warmup",
      duration: activeSplit.warmupSec || 300,
      label: "Warm-up",
      cue: activeSplit.warmupCue || "Arm circles, band pull-aparts, light cardio",
    });

    activeSplit.exercises.forEach((ex, exIdx) => {
      for (let s = 0; s < activeSplit.setsPerExercise; s++) {
        arr.push({
          type: "work",
          exIdx,
          setIdx: s,
          duration: activeSplit.workSec,
          label: ex.name,
          cue: ex.cue,
          exercise: ex,
        });
        if (s < activeSplit.setsPerExercise - 1) {
          arr.push({
            type: "rest",
            exIdx,
            setIdx: s,
            duration: activeSplit.restBetweenSets,
            label: ex.name,
            cue: "Catch your breath, shake it out, prepare for the next set",
            exercise: ex,
          });
        }
      }
      if (exIdx < activeSplit.exercises.length - 1) {
        const nextEx = activeSplit.exercises[exIdx + 1];
        arr.push({
          type: "restEx",
          exIdx,
          duration: activeSplit.restBetweenExercises,
          label: "Rest & Transition",
          cue: `Set up for: ${nextEx.name}`,
          nextName: nextEx.name,
          exercise: ex,
        });
      }
    });

    arr.push({
      type: "cooldown",
      duration: activeSplit.cooldownSec || 180,
      label: "Cool-down",
      cue: activeSplit.cooldownCue || "Full stretch, deep breathing, lower heart rate",
    });

    return arr;
  }, [activeSplit]);

  // Dynamically computed total duration in minutes
  const totalEstimatedMinutes = useMemo(() => {
    const totalSec = steps.reduce((sum, s) => sum + (s.duration || 0), 0);
    return Math.round(totalSec / 60);
  }, [steps]);

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
    const logsToSave = activeSplit.exercises.map((ex) => ({
      id: Date.now() + Math.random(),
      exercise: ex.name,
      load: Number(exerciseWeights[ex.id] ?? ex.defaultLoad),
      unit: "kg",
      reps: 10,
      sets: activeSplit.setsPerExercise,
      note: `${activeSplit.title} session`,
    }));

    if (onFinishWorkout) {
      const minutes = Math.round(elapsedTotalMs / 60000) || totalEstimatedMinutes;
      onFinishWorkout({
        title: activeSplit.title,
        duration: `${minutes} min`,
        exercisesCompleted: activeSplit.exercises.length,
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
      onSaveExerciseWeight?.(exId, updated);
      return { ...prev, [exId]: updated };
    });
  }

  function setDirectWeight(exId, value) {
    const num = parseFloat(value);
    const valid = isNaN(num) ? 0 : Math.max(0, num);
    setExerciseWeights((prev) => ({
      ...prev,
      [exId]: valid,
    }));
    onSaveExerciseWeight?.(exId, valid);
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
    if (!step) return 0;
    if (step.type === "warmup") return 0;
    if (step.type === "cooldown") return activeSplit.exercises.length + 1;
    return 1 + (step.exIdx || 0);
  }
  const totalSegments = activeSplit.exercises.length + 2;
  const currentSegIdx = getSegmentIndex(currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-[#16171E] text-stone-100 flex flex-col sm:bg-stone-950/80 sm:backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4 animate-in fade-in duration-200">
      {/* Container: on mobile acts as a full native page with zero modal framing */}
      <div className="w-full max-w-2xl h-full sm:h-[92vh] sm:max-h-[860px] bg-[#16171E] text-stone-100 rounded-none sm:rounded-3xl border-0 sm:border sm:border-stone-800 shadow-none sm:shadow-2xl flex flex-col overflow-hidden relative">

        {/* =========================================================================
            SCREEN 1: OVERVIEW & EXERCISE WEIGHT LOGGING
            ========================================================================= */}
        {screen === "start" && (
          <>
            {/* Pinned Top Navigation */}
            <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-stone-800/80 bg-[#16171E] shrink-0 sticky top-0 z-10">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-300 hover:text-white transition-colors py-1.5 px-2.5 rounded-xl hover:bg-stone-800 active:scale-95 cursor-pointer"
              >
                <ArrowLeft size={16} /> <span>Workouts</span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Edit Routine & Timings Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditModalTab("timings");
                    setShowEditModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold border border-stone-700 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Sliders size={13} className="text-teal-400" />
                  <span className="hidden sm:inline">Edit Routine & Timings</span>
                  <span className="sm:hidden">Edit</span>
                </button>

                <span
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: activeSplit.bgTint || "#2DD4BF20",
                    borderColor: activeSplit.borderTint || "#2DD4BF40",
                    color: activeSplit.color || "#2DD4BF",
                  }}
                >
                  {activeSplit.badge}
                </span>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>

            {/* Scrollable Main Body */}
            <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-4 space-y-3.5 sm:space-y-4">
              {/* Header Details */}
              <div className="pb-3 border-b border-stone-800/60">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                  {activeSplit.title}
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                  {activeSplit.subtitle} · <span className="text-stone-300 font-medium">{activeSplit.focus}</span>
                </p>

                {/* Meta Highlights Row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-400 mt-2.5">
                  <span>
                    <strong className="text-white font-bold">{activeSplit.exercises.length}</strong> exercises
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-white font-bold">{activeSplit.setsPerExercise}</strong> sets each
                  </span>
                  <span>•</span>
                  <span>
                    ~<strong className="text-white font-bold">{totalEstimatedMinutes}</strong> min total
                  </span>
                  <span>•</span>
                  <span className="text-teal-400 font-semibold">
                    {activeSplit.workSec}s work / {activeSplit.restBetweenSets}s rest
                  </span>
                </div>

                {/* Phase interval legend with direct Edit Timings CTA */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-800/40 text-[11px] text-stone-300">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" /> Warm-up ({formatTimingBadge(activeSplit.warmupSec || 300)})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3E]" /> Work ({formatTimingBadge(activeSplit.workSec || 66)})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" /> Rest ({formatTimingBadge(activeSplit.restBetweenSets || 60)})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" /> Cool-down ({formatTimingBadge(activeSplit.cooldownSec || 180)})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditModalTab("timings");
                      setShowEditModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800/90 hover:bg-stone-700 text-teal-300 hover:text-white border border-stone-700/80 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 size={11} /> Edit Timings
                  </button>
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

                <button
                  type="button"
                  onClick={() => {
                    setEditModalTab("routine");
                    setShowEditModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
                >
                  <Edit2 size={12} className="text-teal-400" />
                  <span>Edit Routine</span>
                </button>
              </div>

              {/* Exercises List */}
              <div className="space-y-3">
                {activeSplit.exercises.map((ex, i) => {
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
                          <button
                            type="button"
                            onClick={() => {
                              setEditModalTab("routine");
                              setShowEditModal(true);
                            }}
                            title="Edit exercise in routine editor"
                            className="p-1 rounded-lg text-stone-400 hover:text-teal-300 hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-800 text-teal-300 border border-stone-700 shrink-0">
                          {ex.muscle}
                        </span>
                      </div>

                      {/* Technique Cue */}
                      <p className="text-xs text-stone-400 leading-relaxed pl-8 -mt-1">
                        {ex.cue}
                      </p>

                      {/* Bottom Weight & Progress Controls: clean non-overlapping row with custom TargetNumberInput */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-stone-800/80 bg-stone-900/40 -mx-3.5 -mb-3.5 px-3.5 py-2.5 rounded-b-2xl">
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

                        {/* Custom-designed Target Number Input with NO spinner flows */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[11px] font-semibold text-stone-400 hidden xs:inline">
                            Target:
                          </span>
                          <TargetNumberInput
                            value={currentWeight}
                            onChange={(val) => setDirectWeight(ex.id, val)}
                            exerciseName={ex.name}
                            step={2.5}
                            unit="kg"
                            size="md"
                            showQuickPills={true}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pinned Bottom CTA Footer */}
            <div className="p-3 sm:p-5 border-t border-stone-800 bg-[#16171E] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={startWorkout}
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#FF5C3E] text-[#11120F] hover:brightness-110 active:scale-[0.99] font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C3E]/20 transition-all cursor-pointer"
              >
                <Play size={17} fill="#11120F" /> Start {totalEstimatedMinutes}-Min Workout
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
                        Ex {(currentStep.exIdx || 0) + 1}/{activeSplit.exercises.length} · Set {(currentStep.setIdx || 0) + 1}/{activeSplit.setsPerExercise}
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
                {activeSplit.title} Done!
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
                    {activeSplit.exercises.length * activeSplit.setsPerExercise}
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
                  {activeSplit.exercises.map((ex) => {
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
            <div className="p-3 sm:p-5 border-t border-stone-800 bg-[#16171E] shrink-0 flex flex-col gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-teal-400 text-[#11120F] font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-teal-400/20"
              >
                Done & Return to Workouts
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

        {/* Modal: Customize Routine & Timings */}
        {showEditModal && (
          <WorkoutRoutineEditorModal
            split={activeSplit}
            initialTab={editModalTab}
            onSave={handleSaveCustomSplit}
            onClose={() => setShowEditModal(false)}
            onResetDefaults={handleResetSplitDefaults}
          />
        )}
      </div>
    </div>
  );
}
