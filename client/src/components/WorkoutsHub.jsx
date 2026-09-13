import React, { useState } from "react";
import {
  Dumbbell,
  Scale,
  Flame,
  Clock,
  Play,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  Layers,
  Sliders,
  Edit3,
} from "lucide-react";
import { WORKOUT_SPLITS } from "./workoutData";
import { WorkoutSplitSubpage } from "./WorkoutSplitSubpage";

export function WorkoutsHub({
  currentWeight,
  targetWeight,
  startWeight,
  targetDate,
  goalProgress,
  onAddWeight,
  workouts = [],
  liftLog = [],
  onFinishWorkoutSession,
  onSaveExerciseWeight,
}) {
  const [activeSplitId, setActiveSplitId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [inputWeight, setInputWeight] = useState("");
  const [weightFeedback, setWeightFeedback] = useState("");

  const activeSplit = WORKOUT_SPLITS.find((s) => s.id === activeSplitId);

  function handleLogWeight(e) {
    e?.preventDefault();
    if (!inputWeight) return;
    const val = parseFloat(inputWeight);
    if (!isNaN(val) && val > 0) {
      onAddWeight(val);
      setWeightFeedback(`Logged ${val} kg for today!`);
      setInputWeight("");
      setTimeout(() => setWeightFeedback(""), 3500);
    }
  }

  // Filter splits
  const filteredSplits = WORKOUT_SPLITS.filter((split) => {
    if (filter === "all") return true;
    if (filter === "arms") return split.id === "arms";
    if (filter === "upper") return ["chest", "shoulders", "back", "arms"].includes(split.id);
    if (filter === "lower") return split.id === "legs";
    return true;
  });

  // Check last completed workout for each split
  function getLastCompleted(splitTitle) {
    const found = workouts.find(
      (w) => w.type?.toLowerCase().includes(splitTitle.toLowerCase()) ||
             splitTitle.toLowerCase().includes(w.type?.toLowerCase() || "")
    );
    return found ? found.date : null;
  }

  // If a split is selected, open it as a full dedicated page!
  if (activeSplit) {
    return (
      <div className="workout-split-page-view w-full animate-in fade-in duration-200">
        <WorkoutSplitSubpage
          split={activeSplit}
          liftLog={liftLog}
          onClose={() => setActiveSplitId(null)}
          onFinishWorkout={(summary) => {
            if (onFinishWorkoutSession) {
              onFinishWorkoutSession(summary);
            }
            setActiveSplitId(null);
          }}
          onSaveExerciseWeight={onSaveExerciseWeight}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* =========================================================================
          1. LOG YOUR WEIGHT TODAY
          ========================================================================= */}
      <div className="bg-[#FFFEFA] border border-stone-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-xs sm:shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#11120F] tracking-tight">
                Log Your Weight Today
              </h3>
              <p className="text-xs text-[#5F625D]">
                Consistent morning weigh-ins track genuine progress toward your target.
              </p>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-1.5 rounded-2xl border border-stone-200/60 self-start sm:self-auto">
            <span className="text-xs text-[#5F625D] font-medium">Target:</span>
            <span className="text-sm font-bold text-[#11120F] tabular-nums font-mono">
              {currentWeight} kg
            </span>
            <span className="text-stone-400 text-xs">→</span>
            <span className="text-sm font-bold text-emerald-600 tabular-nums font-mono">
              {targetWeight} kg
            </span>
          </div>
        </div>

        {/* Progress Bar & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-center pt-4">
          <div>
            <div className="flex items-center justify-between text-xs text-[#5F625D] mb-1.5 font-medium">
              <span>Goal Journey ({startWeight}kg → {targetWeight}kg)</span>
              <span className="font-bold text-[#11120F] tabular-nums">
                {Math.round(goalProgress)}% achieved
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#2F745C] transition-all duration-500"
                style={{ width: `${Math.max(5, Math.min(100, goalProgress))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#687168] mt-1.5">
              Target date: <strong className="text-[#11120F] font-semibold">{targetDate}</strong> · Consistent conditions provide cleanest trend.
            </p>
          </div>

          {/* Logging Form */}
          <form onSubmit={handleLogWeight} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                placeholder="Today's weight (e.g. 74.5)"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold rounded-2xl border border-stone-200 px-3.5 py-2.5 bg-white text-[#11120F] placeholder:text-stone-400 focus:outline-none focus:border-[#2F745C] shadow-sm tabular-nums"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-stone-400 pointer-events-none">
                kg
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputWeight}
              className="px-4 py-2.5 rounded-2xl bg-[#11120F] hover:bg-[#242720] text-white text-xs font-bold tracking-wide transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              Log Weight
            </button>
          </form>
        </div>

        {weightFeedback && (
          <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={14} /> {weightFeedback}
          </div>
        )}
      </div>

      {/* =========================================================================
          2. WORKOUT SPLITS (WORKOUTS HUB)
          ========================================================================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#11120F] tracking-tight flex items-center gap-2">
              <Dumbbell className="text-[#2F745C]" size={22} /> Workout Splits
            </h2>
            <p className="text-xs text-[#5F625D] mt-0.5">
              Select any split to preview the routine, set weights, and launch timed work/rest intervals.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All Splits" },
              { id: "arms", label: "Arms in 60" },
              { id: "upper", label: "Upper Body" },
              { id: "lower", label: "Lower Body" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                  filter === f.id
                    ? "bg-[#11120F] text-white"
                    : "bg-stone-100 text-[#5F625D] hover:bg-stone-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Splits Cards Grid: Clean, Uncluttered, No Overlapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSplits.map((split) => {
            const lastDone = getLastCompleted(split.title);

            return (
              <div
                key={split.id}
                onClick={() => setActiveSplitId(split.id)}
                className="group bg-[#FFFEFA] border border-stone-200 rounded-3xl p-5 hover:border-stone-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                {/* Subtle top accent border */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5 transition-all"
                  style={{ backgroundColor: split.color }}
                />

                <div className="space-y-3">
                  {/* Top Bar: Badge & Last Done */}
                  <div className="flex items-center justify-between gap-2">
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

                    {lastDone ? (
                      <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        Done {lastDone}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-stone-400">
                        Ready
                      </span>
                    )}
                  </div>

                  {/* Title & Focus */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#11120F] tracking-tight group-hover:text-[#2F745C] transition-colors">
                      {split.title}
                    </h3>
                    <p className="text-xs text-[#5F625D] mt-0.5 font-medium">
                      {split.subtitle} · {split.focus}
                    </p>
                  </div>

                  {/* 3 Metrics Boxes */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-100">
                      <span className="block text-xs font-bold text-[#11120F] tabular-nums">
                        {split.exercises.length}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                        Exercises
                      </span>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-100">
                      <span className="block text-xs font-bold text-[#11120F] tabular-nums">
                        {split.setsPerExercise}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                        Sets Each
                      </span>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-2 border border-stone-100">
                      <span className="block text-xs font-bold text-[#11120F] tabular-nums">
                        ~{split.estimatedMin}m
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                        Duration
                      </span>
                    </div>
                  </div>

                  {/* Exercise Routine Summary */}
                  <div className="text-[11px] text-[#5F625D] bg-stone-50/70 rounded-xl p-2.5 border border-stone-100">
                    <span className="font-semibold text-stone-700">Routine: </span>
                    {split.exercises.slice(0, 3).map((e) => e.name).join(", ")}
                    {split.exercises.length > 3 && (
                      <span className="text-stone-400 font-medium">
                        {" "}and {split.exercises.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Timing Intervals Bar */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-stone-500 pt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 font-medium">
                      Warm-up (5m)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-medium">
                      Work (66s)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-medium">
                      Rest (60s)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                      Cool-down (3m)
                    </span>
                  </div>
                </div>

                {/* Card Action Button: Single prominent button preventing overlaps */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSplitId(split.id);
                    }}
                    className="text-[11.5px] font-semibold text-stone-600 hover:text-[#2F745C] transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-100"
                  >
                    <Sliders size={12} className="text-[#2F745C]" />
                    <span>Edit Routine & Timings</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSplitId(split.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all text-white shadow-sm cursor-pointer hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: split.color }}
                  >
                    <Play size={12} fill="currentColor" /> Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
