import React, { useState, useMemo } from "react";
import {
  X,
  Sliders,
  Dumbbell,
  Clock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Flame,
  Sparkles,
  Info,
} from "lucide-react";
import { TargetNumberInput } from "./TargetNumberInput";

/**
 * Format seconds into concise badge representation (e.g. 300s -> 5m, 66s -> 66s)
 */
export function formatTimingBadge(sec) {
  if (!sec && sec !== 0) return "0s";
  const n = Number(sec);
  if (n >= 60 && n % 60 === 0) {
    return `${n / 60}m`;
  }
  if (n >= 60) {
    const m = Math.floor(n / 60);
    const s = n % 60;
    return `${m}m ${s}s`;
  }
  return `${n}s`;
}

export function WorkoutRoutineEditorModal({
  split,
  initialTab = "timings",
  onSave,
  onClose,
  onResetDefaults,
}) {
  const [tab, setTab] = useState(initialTab); // "timings" | "routine"

  // Mutable draft state
  const [warmupSec, setWarmupSec] = useState(split.warmupSec ?? 300);
  const [warmupCue, setWarmupCue] = useState(
    split.warmupCue ?? "Arm circles, band pull-aparts, light cardio"
  );
  const [workSec, setWorkSec] = useState(split.workSec ?? 66);
  const [restBetweenSets, setRestBetweenSets] = useState(
    split.restBetweenSets ?? 60
  );
  const [restBetweenExercises, setRestBetweenExercises] = useState(
    split.restBetweenExercises ?? 60
  );
  const [cooldownSec, setCooldownSec] = useState(split.cooldownSec ?? 180);
  const [cooldownCue, setCooldownCue] = useState(
    split.cooldownCue ?? "Full stretch, deep breathing, lower heart rate"
  );
  const [setsPerExercise, setSetsPerExercise] = useState(
    split.setsPerExercise ?? 5
  );

  // Exercise list draft
  const [exercises, setExercises] = useState(() =>
    (split.exercises || []).map((ex) => ({ ...ex }))
  );

  // New exercise inline form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState(split.focus || "Arms");
  const [newExCue, setNewExCue] = useState("");
  const [newExLoad, setNewExLoad] = useState(12.5);

  // Dynamic workout duration calculation
  const totalEstimatedMinutes = useMemo(() => {
    const numEx = exercises.length;
    if (numEx === 0) return 0;
    const workTime = numEx * setsPerExercise * workSec;
    const setRestTime = numEx * Math.max(0, setsPerExercise - 1) * restBetweenSets;
    const exTransitionTime = Math.max(0, numEx - 1) * restBetweenExercises;
    const totalSec = warmupSec + workTime + setRestTime + exTransitionTime + cooldownSec;
    return Math.round(totalSec / 60);
  }, [
    exercises.length,
    setsPerExercise,
    workSec,
    restBetweenSets,
    restBetweenExercises,
    warmupSec,
    cooldownSec,
  ]);

  // Exercise mutation handlers
  const handleMoveExercise = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;
    const next = [...exercises];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setExercises(next);
  };

  const handleDeleteExercise = (idx) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const handleUpdateExercise = (idx, field, value) => {
    setExercises(
      exercises.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );
  };

  const handleAddExercise = (e) => {
    e?.preventDefault();
    if (!newExName.trim()) return;

    const newExercise = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newExName.trim(),
      muscle: newExMuscle.trim() || split.focus || "Arms",
      tag: "Custom",
      cue: newExCue.trim() || "Controlled tempo, full contraction, steady breath",
      defaultLoad: Number(newExLoad) || 10,
    };

    setExercises([...exercises, newExercise]);
    setNewExName("");
    setNewExCue("");
    setShowAddForm(false);
  };

  const handleSave = () => {
    const updated = {
      ...split,
      warmupSec: Math.max(0, Number(warmupSec)),
      warmupCue,
      workSec: Math.max(10, Number(workSec)),
      restBetweenSets: Math.max(5, Number(restBetweenSets)),
      restBetweenExercises: Math.max(5, Number(restBetweenExercises)),
      cooldownSec: Math.max(0, Number(cooldownSec)),
      cooldownCue,
      setsPerExercise: Math.max(1, Number(setsPerExercise)),
      estimatedMin: totalEstimatedMinutes,
      exercises,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#181922] text-stone-100 flex flex-col sm:bg-stone-950/80 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center p-0 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#181922] text-stone-100 rounded-none sm:rounded-3xl border-0 sm:border sm:border-stone-800 shadow-none sm:shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-800 bg-[#16171E] shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Sliders size={18} className="text-teal-400" />
              Customize Routine & Timings
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[260px] sm:max-w-none">
              Adjust interval durations or modify exercises for{" "}
              <strong className="text-stone-200">{split.title}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-stone-800 px-5 sm:px-6 bg-[#15161F] shrink-0 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setTab("timings")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              tab === "timings"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Clock size={15} />
            Interval Timings
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
              {formatTimingBadge(warmupSec)} · {workSec}s · {restBetweenSets}s ·{" "}
              {formatTimingBadge(cooldownSec)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("routine")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              tab === "routine"
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Dumbbell size={15} />
            Exercises ({exercises.length})
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* =========================================================================
              TAB 1: TIMINGS CONFIGURATION
              ========================================================================= */}
          {tab === "timings" && (
            <div className="space-y-5">
              {/* Estimated Total Time Banner */}
              <div className="bg-[#1C1E27] border border-stone-800 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-400/15 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Estimated Total Duration: ~{totalEstimatedMinutes} min
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {exercises.length} exercises × {setsPerExercise} sets with your active timings
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  ~{totalEstimatedMinutes}m
                </span>
              </div>

              {/* 1. Warm-up Timing Card */}
              <div className="bg-[#1F202B] border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" />
                    <h3 className="text-sm font-extrabold text-white">
                      Warm-up ({formatTimingBadge(warmupSec)})
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#A78BFA] bg-[#A78BFA]/15 px-2.5 py-0.5 rounded-full border border-[#A78BFA]/30">
                    {warmupSec}s ({Math.round(warmupSec / 60)} min)
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-400 font-medium">Presets:</span>
                  {[
                    { label: "3m (180s)", sec: 180 },
                    { label: "5m (300s)", sec: 300 },
                    { label: "8m (480s)", sec: 480 },
                    { label: "10m (600s)", sec: 600 },
                  ].map((p) => (
                    <button
                      key={p.sec}
                      type="button"
                      onClick={() => setWarmupSec(p.sec)}
                      className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        warmupSec === p.sec
                          ? "bg-[#A78BFA] text-stone-950 font-bold shadow-sm"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-xs text-stone-400">Custom Duration:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWarmupSec((s) => Math.max(30, s - 30))}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      -30s
                    </button>
                    <span className="font-mono text-xs font-bold text-white tabular-nums px-2">
                      {warmupSec}s
                    </span>
                    <button
                      type="button"
                      onClick={() => setWarmupSec((s) => s + 30)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      +30s
                    </button>
                  </div>
                </div>

                {/* Warm-up Cue */}
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                    Warm-up Focus / Movement Cue:
                  </label>
                  <input
                    type="text"
                    value={warmupCue}
                    onChange={(e) => setWarmupCue(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-700/80 bg-stone-900 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#A78BFA]"
                  />
                </div>
              </div>

              {/* 2. Work Timing Card */}
              <div className="bg-[#1F202B] border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C3E]" />
                    <h3 className="text-sm font-extrabold text-white">
                      Work Interval ({workSec}s)
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FF5C3E] bg-[#FF5C3E]/15 px-2.5 py-0.5 rounded-full border border-[#FF5C3E]/30">
                    {workSec}s per set
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-400 font-medium">Presets:</span>
                  {[
                    { label: "45s", sec: 45 },
                    { label: "50s", sec: 50 },
                    { label: "60s", sec: 60 },
                    { label: "66s (Default)", sec: 66 },
                    { label: "75s", sec: 75 },
                    { label: "90s", sec: 90 },
                  ].map((p) => (
                    <button
                      key={p.sec}
                      type="button"
                      onClick={() => setWorkSec(p.sec)}
                      className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        workSec === p.sec
                          ? "bg-[#FF5C3E] text-stone-950 font-bold shadow-sm"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-xs text-stone-400">Custom Duration:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWorkSec((s) => Math.max(15, s - 5))}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      -5s
                    </button>
                    <span className="font-mono text-xs font-bold text-white tabular-nums px-2">
                      {workSec}s
                    </span>
                    <button
                      type="button"
                      onClick={() => setWorkSec((s) => s + 5)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      +5s
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Rest Timing Card */}
              <div className="bg-[#1F202B] border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]" />
                    <h3 className="text-sm font-extrabold text-white">
                      Rest Between Sets ({restBetweenSets}s)
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#2DD4BF] bg-[#2DD4BF]/15 px-2.5 py-0.5 rounded-full border border-[#2DD4BF]/30">
                    {restBetweenSets}s rest
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-400 font-medium">Presets:</span>
                  {[
                    { label: "30s", sec: 30 },
                    { label: "45s", sec: 45 },
                    { label: "60s (Default)", sec: 60 },
                    { label: "75s", sec: 75 },
                    { label: "90s", sec: 90 },
                    { label: "120s", sec: 120 },
                  ].map((p) => (
                    <button
                      key={p.sec}
                      type="button"
                      onClick={() => setRestBetweenSets(p.sec)}
                      className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        restBetweenSets === p.sec
                          ? "bg-[#2DD4BF] text-stone-950 font-bold shadow-sm"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-xs text-stone-400">Custom Duration:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRestBetweenSets((s) => Math.max(10, s - 5))}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      -5s
                    </button>
                    <span className="font-mono text-xs font-bold text-white tabular-nums px-2">
                      {restBetweenSets}s
                    </span>
                    <button
                      type="button"
                      onClick={() => setRestBetweenSets((s) => s + 5)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      +5s
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Cool-down Timing Card */}
              <div className="bg-[#1F202B] border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                    <h3 className="text-sm font-extrabold text-white">
                      Cool-down ({formatTimingBadge(cooldownSec)})
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FBBF24] bg-[#FBBF24]/15 px-2.5 py-0.5 rounded-full border border-[#FBBF24]/30">
                    {cooldownSec}s ({Math.round(cooldownSec / 60)} min)
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-400 font-medium">Presets:</span>
                  {[
                    { label: "1m (60s)", sec: 60 },
                    { label: "2m (120s)", sec: 120 },
                    { label: "3m (180s)", sec: 180 },
                    { label: "5m (300s)", sec: 300 },
                  ].map((p) => (
                    <button
                      key={p.sec}
                      type="button"
                      onClick={() => setCooldownSec(p.sec)}
                      className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        cooldownSec === p.sec
                          ? "bg-[#FBBF24] text-stone-950 font-bold shadow-sm"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                  <span className="text-xs text-stone-400">Custom Duration:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCooldownSec((s) => Math.max(30, s - 30))}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      -30s
                    </button>
                    <span className="font-mono text-xs font-bold text-white tabular-nums px-2">
                      {cooldownSec}s
                    </span>
                    <button
                      type="button"
                      onClick={() => setCooldownSec((s) => s + 30)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      +30s
                    </button>
                  </div>
                </div>

                {/* Cool-down Cue */}
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                    Cool-down Focus / Stretching Cue:
                  </label>
                  <input
                    type="text"
                    value={cooldownCue}
                    onChange={(e) => setCooldownCue(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-700/80 bg-stone-900 px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>
              </div>

              {/* 5. Sets Per Exercise */}
              <div className="bg-[#1F202B] border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Sets Per Exercise</h3>
                  <p className="text-xs text-stone-400">
                    Number of work sets performed for each exercise routine
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSetsPerExercise(num)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        setsPerExercise === num
                          ? "bg-teal-400 text-stone-950 shadow-md"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: EXERCISES ROUTINE CONFIGURATION
              ========================================================================= */}
          {tab === "routine" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-400">
                  Reorder, rename, or add custom exercises. Changes will be used when launching this split.
                </p>

                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-400 hover:brightness-110 text-[#11120F] text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Add Exercise
                </button>
              </div>

              {/* Inline Add Exercise Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddExercise}
                  className="bg-[#232532] border-2 border-teal-400/40 rounded-2xl p-4 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                      <Plus size={14} /> New Exercise Setup
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-stone-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Exercise Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Incline Dumbbell Curl"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        className="w-full text-xs font-semibold rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-white placeholder:text-stone-500 focus:outline-none focus:border-teal-400"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                        Target Muscle Group
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Biceps, Triceps, Delts"
                        value={newExMuscle}
                        onChange={(e) => setNewExMuscle(e.target.value)}
                        className="w-full text-xs font-semibold rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-white placeholder:text-stone-500 focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Technique Cue / Instruction
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Keep elbows stationary, slow controlled lowering"
                      value={newExCue}
                      onChange={(e) => setNewExCue(e.target.value)}
                      className="w-full text-xs font-medium rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-white placeholder:text-stone-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">Default Target Load:</span>
                      <div className="w-36">
                        <TargetNumberInput
                          value={newExLoad}
                          onChange={setNewExLoad}
                          exerciseName={newExName || "New exercise"}
                          size="sm"
                          showQuickPills={false}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!newExName.trim()}
                      className="px-4 py-2 rounded-xl bg-teal-400 text-stone-950 text-xs font-bold hover:brightness-110 disabled:opacity-40 cursor-pointer"
                    >
                      Save to Routine
                    </button>
                  </div>
                </form>
              )}

              {/* Current Exercises List */}
              <div className="space-y-2.5">
                {exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="bg-[#20222C] border border-stone-800 rounded-2xl p-3.5 space-y-3 hover:border-stone-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => handleUpdateExercise(idx, "name", e.target.value)}
                          className="flex-1 font-bold text-sm text-white bg-transparent border-b border-transparent focus:border-teal-400 focus:outline-none pb-0.5"
                          placeholder="Exercise name"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Muscle pill input */}
                        <input
                          type="text"
                          value={ex.muscle}
                          onChange={(e) => handleUpdateExercise(idx, "muscle", e.target.value)}
                          className="w-20 text-[10px] uppercase font-bold text-teal-300 bg-stone-800/90 border border-stone-700 rounded-full px-2 py-0.5 text-center focus:outline-none focus:border-teal-400"
                        />

                        {/* Order controls */}
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(idx, -1)}
                          disabled={idx === 0}
                          title="Move up"
                          className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveExercise(idx, 1)}
                          disabled={idx === exercises.length - 1}
                          title="Move down"
                          className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown size={13} />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteExercise(idx)}
                          disabled={exercises.length <= 1}
                          title="Delete exercise"
                          className="p-1 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 disabled:opacity-20 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Technique Cue Input */}
                    <div className="pl-8">
                      <input
                        type="text"
                        value={ex.cue}
                        onChange={(e) => handleUpdateExercise(idx, "cue", e.target.value)}
                        placeholder="Cue / instructions..."
                        className="w-full text-xs text-stone-400 bg-stone-900/60 border border-stone-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-teal-400 focus:text-stone-200"
                      />
                    </div>

                    {/* Default Target Load */}
                    <div className="pl-8 flex items-center justify-between pt-1 border-t border-stone-800/60">
                      <span className="text-[11px] text-stone-400">Default Target Load:</span>
                      <TargetNumberInput
                        value={ex.defaultLoad}
                        onChange={(val) => handleUpdateExercise(idx, "defaultLoad", val)}
                        exerciseName={ex.name}
                        size="sm"
                        showQuickPills={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-3 sm:p-5 border-t border-stone-800 bg-[#15161F] shrink-0 flex items-center justify-between gap-2 sm:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset this split's timings and routine to default values?")) {
                onResetDefaults();
              }
            }}
            className="text-[11px] sm:text-xs font-semibold text-stone-400 hover:text-rose-400 transition-colors flex items-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl hover:bg-stone-800 cursor-pointer"
          >
            <RotateCcw size={12} /> <span className="hidden xs:inline">Reset to Defaults</span><span className="xs:hidden">Reset</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-teal-400 hover:brightness-110 text-stone-950 text-xs font-extrabold tracking-wide transition-all shadow-md shadow-teal-400/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check size={14} strokeWidth={2.5} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
