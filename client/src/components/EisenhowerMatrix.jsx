import React, { useState, useMemo } from "react";
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  HeartPulse,
  Wallet,
  Briefcase,
  Users,
  ChevronDown,
  ArrowUpDown,
  Zap,
  ShieldAlert,
  BrainCircuit
} from "lucide-react";

export const QUADRANT_META = {
  Q1: {
    id: "Q1",
    title: "Do First · Urgent & Important",
    shortTitle: "Q1: Do First",
    priority: "P1",
    subtitle: "Critical deadlines, urgent commitments & high-stakes emergencies",
    color: "rose",
    borderClass: "border-rose-300/80 bg-rose-50/40",
    headerBg: "bg-rose-100/70 text-rose-900",
    badgeClass: "bg-rose-600 text-white",
    pillClass: "bg-rose-100 text-rose-800 border-rose-200",
    accentIcon: ShieldAlert,
    tagline: "Crisis & Immediate Action",
    coachAdvice: "Tackle immediately with zero distractions before anything else.",
  },
  Q2: {
    id: "Q2",
    title: "Schedule · Not Urgent & Important",
    shortTitle: "Q2: Deep Work",
    priority: "P2",
    subtitle: "Strategic study, progressive fitness, wealth building & growth",
    color: "emerald",
    borderClass: "border-emerald-300/80 bg-emerald-50/40",
    headerBg: "bg-emerald-100/70 text-emerald-900",
    badgeClass: "bg-emerald-600 text-white",
    pillClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accentIcon: Sparkles,
    tagline: "High-Leverage Growth Zone",
    coachAdvice: "This is your superpower quadrant. Protect uninterrupted deep-work blocks here.",
  },
  Q3: {
    id: "Q3",
    title: "Delegate / Fast Wins · Urgent & Not Important",
    shortTitle: "Q3: Quick Wins",
    priority: "P3",
    subtitle: "Routine emails, minor errands, administrative logistics & quick follow-ups",
    color: "amber",
    borderClass: "border-amber-300/80 bg-amber-50/40",
    headerBg: "bg-amber-100/70 text-amber-900",
    badgeClass: "bg-amber-600 text-white",
    pillClass: "bg-amber-100 text-amber-800 border-amber-200",
    accentIcon: Zap,
    tagline: "Time-Bound Operations",
    coachAdvice: "Batch these into one 20-minute window or automate/delegate when possible.",
  },
  Q4: {
    id: "Q4",
    title: "Declutter · Not Urgent & Not Important",
    shortTitle: "Q4: Backlog",
    priority: "P4",
    subtitle: "Low-leverage ideas, someday/maybe backlog & unessential distractions",
    color: "stone",
    borderClass: "border-stone-300/80 bg-stone-50/50",
    headerBg: "bg-stone-200/70 text-stone-800",
    badgeClass: "bg-stone-600 text-white",
    pillClass: "bg-stone-100 text-stone-700 border-stone-200",
    accentIcon: Clock,
    tagline: "Backlog & Parking Lot",
    coachAdvice: "Re-evaluate weekly. Drop anything that doesn't advance your academic or personal goals.",
  },
};

const DOMAIN_ICONS = {
  georgetown: GraduationCap,
  school: GraduationCap,
  health: HeartPulse,
  finance: Wallet,
  work: Briefcase,
  relationships: Users,
  general: Layers,
};

export function EisenhowerMatrix({
  todos = [],
  onToggleTodo,
  onAddTodo,
  onDeleteTodo,
  onMoveQuadrant,
  onOpenVoiceAssistant,
  coachInsight = null,
  activeFilter = "all",
  onFilterChange = () => {},
}) {
  const [activeTab, setActiveTab] = useState("matrix"); // "matrix" | "priorities"
  const [quickInputs, setQuickInputs] = useState({ Q1: "", Q2: "", Q3: "", Q4: "" });
  const [selectedDomain, setSelectedDomain] = useState("all");

  // Normalize todos with default quadrant and priority if not set
  const normalizedTodos = useMemo(() => {
    return todos.map((t) => {
      let quad = t.quadrant;
      if (!quad) {
        if (t.priority === "P1" || t.urgent) quad = "Q1";
        else if (t.priority === "P3") quad = "Q3";
        else if (t.priority === "P4") quad = "Q4";
        else quad = "Q2"; // default high leverage
      }
      return {
        ...t,
        quadrant: quad,
        priority: t.priority || (quad === "Q1" ? "P1" : quad === "Q2" ? "P2" : quad === "Q3" ? "P3" : "P4"),
      };
    });
  }, [todos]);

  // Filtered by domain if set
  const filteredTodos = useMemo(() => {
    if (selectedDomain === "all") return normalizedTodos;
    return normalizedTodos.filter((t) => {
      const d = (t.domain || t.category || "").toLowerCase();
      if (selectedDomain === "georgetown") return d.includes("georgetown") || d.includes("school");
      return d.includes(selectedDomain);
    });
  }, [normalizedTodos, selectedDomain]);

  // Quadrants grouping
  const quadrants = useMemo(() => {
    return {
      Q1: filteredTodos.filter((t) => t.quadrant === "Q1"),
      Q2: filteredTodos.filter((t) => t.quadrant === "Q2"),
      Q3: filteredTodos.filter((t) => t.quadrant === "Q3"),
      Q4: filteredTodos.filter((t) => t.quadrant === "Q4"),
    };
  }, [filteredTodos]);

  // Workload and Coach Analytics
  const stats = useMemo(() => {
    const total = filteredTodos.length;
    const completed = filteredTodos.filter((t) => t.done).length;
    const q1Count = quadrants.Q1.filter((t) => !t.done).length;
    const q2Count = quadrants.Q2.filter((t) => !t.done).length;
    const q3Count = quadrants.Q3.filter((t) => !t.done).length;
    const q4Count = quadrants.Q4.filter((t) => !t.done).length;

    const activeTotal = q1Count + q2Count + q3Count + q4Count;
    const q2Ratio = activeTotal > 0 ? Math.round((q2Count / activeTotal) * 100) : 0;
    const q1Ratio = activeTotal > 0 ? Math.round((q1Count / activeTotal) * 100) : 0;

    let coachRecommendation = "Your task load is healthy. Protect your Q2 deep-work blocks for Georgetown and strength training.";
    if (q1Count > 4) {
      coachRecommendation = `High fire-fighting load (${q1Count} urgent tasks in Q1). Focus solely on resolving Q1 blockers before starting new initiatives.`;
    } else if (q2Ratio >= 60) {
      coachRecommendation = `Outstanding strategic alignment! ${q2Ratio}% of your active work is in Q2 (Growth & Deep Work). You are building durable leverage.`;
    } else if (q3Count > q2Count) {
      coachRecommendation = `Caution: Q3 routine tasks (${q3Count}) outnumber Q2 deep work. Batch or delegate quick admin so your study time stays protected.`;
    }

    return {
      total,
      completed,
      activeTotal,
      q1Count,
      q2Count,
      q3Count,
      q4Count,
      q2Ratio,
      q1Ratio,
      coachRecommendation,
    };
  }, [filteredTodos, quadrants]);

  function handleAddQuick(quadrant) {
    const text = (quickInputs[quadrant] || "").trim();
    if (!text) return;
    onAddTodo({
      text,
      quadrant,
      priority: quadrant === "Q1" ? "P1" : quadrant === "Q2" ? "P2" : quadrant === "Q3" ? "P3" : "P4",
      domain: selectedDomain === "all" ? "general" : selectedDomain,
      due: new Date().toISOString().slice(0, 10),
    });
    setQuickInputs((prev) => ({ ...prev, [quadrant]: "" }));
  }

  return (
    <div className="space-y-6">
      {/* Header & AI Coach Status Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <BrainCircuit size={14} className="text-emerald-600" />
              <span>AI Eisenhower Matrix Coach</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Priorities & Task Matrix
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-2xl leading-relaxed">
              Automated task triage via Eisenhower 4-quadrant architecture. Voice notes automatically map to Q1–Q4 across Georgetown, Health, Finance, Work, and Relationships.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {onOpenVoiceAssistant && (
              <button
                type="button"
                onClick={onOpenVoiceAssistant}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-500 text-stone-950 font-semibold text-xs transition-all active:scale-[0.98] shadow-xs cursor-pointer"
              >
                <Sparkles size={14} className="text-stone-900" />
                <span>Voice Note to Coach</span>
              </button>
            )}

            <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "matrix"
                    ? "bg-white text-stone-900 shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                4-Quadrant Matrix
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("priorities")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "priorities"
                    ? "bg-white text-stone-900 shadow-xs font-semibold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Priority Ranked (P1–P4)
              </button>
            </div>
          </div>
        </div>

        {/* AI Coach Live Insight Banner */}
        <div className="mt-5 rounded-xl border border-stone-200 bg-[#F0F1EE] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <BrainCircuit size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-900">Coach Assessment</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {stats.q2Ratio}% Q2 Deep Work
                </span>
                {stats.q1Count > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    {stats.q1Count} Urgent in Q1
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-700 leading-relaxed font-medium">
                {coachInsight || stats.coachRecommendation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs font-mono">
            <div className="text-center px-2 py-1 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px] font-sans">Active</span>
              <span className="font-bold text-stone-900">{stats.activeTotal}</span>
            </div>
            <div className="text-center px-2 py-1 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px] font-sans">Done</span>
              <span className="font-bold text-emerald-600">{stats.completed}</span>
            </div>
            <div className="text-center px-2 py-1 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px] font-sans">Q2 Ratio</span>
              <span className="font-bold text-stone-900">{stats.q2Ratio}%</span>
            </div>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 font-medium mr-1 text-[11px]">Domain:</span>
          {[
            { id: "all", label: "All Tasks" },
            { id: "georgetown", label: "Georgetown School", icon: GraduationCap },
            { id: "health", label: "Health & Fitness", icon: HeartPulse },
            { id: "finance", label: "Finance & Wealth", icon: Wallet },
            { id: "work", label: "Work & Projects", icon: Briefcase },
            { id: "relationships", label: "Relationships", icon: Users },
          ].map((domain) => {
            const Icon = domain.icon;
            const isSelected = selectedDomain === domain.id;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => setSelectedDomain(domain.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs ${
                  isSelected
                    ? "bg-stone-900 text-white font-semibold shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                }`}
              >
                {Icon && <Icon size={12} />}
                <span>{domain.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MATRIX VIEW (4 QUADRANTS) */}
      {activeTab === "matrix" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(["Q1", "Q2", "Q3", "Q4"]).map((qKey) => {
            const meta = QUADRANT_META[qKey];
            const qTasks = quadrants[qKey] || [];
            const activeCount = qTasks.filter((t) => !t.done).length;
            const AccentIcon = meta.accentIcon;

            return (
              <div
                key={qKey}
                className={`rounded-2xl border ${meta.borderClass} bg-white p-5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm`}
              >
                {/* Quadrant Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${meta.badgeClass}`}>
                        {meta.priority}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 leading-none">
                          {meta.shortTitle}
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {meta.tagline}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      {activeCount} active
                    </span>
                  </div>

                  {/* Coach Quadrant Advice Note */}
                  <div className="mt-2.5 mb-3 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/60 text-[11px] text-stone-600 flex items-center gap-1.5">
                    <AccentIcon size={13} className="text-stone-400 shrink-0" />
                    <span>{meta.coachAdvice}</span>
                  </div>

                  {/* Task List in this Quadrant */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {qTasks.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                        No tasks in {qKey}. Voice note or type below to add.
                      </div>
                    ) : (
                      qTasks.map((task) => {
                        const DomainIcon = DOMAIN_ICONS[(task.domain || task.category || "general").toLowerCase()] || Layers;
                        return (
                          <div
                            key={task.id}
                            className={`group flex items-start justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                              task.done
                                ? "border-stone-200 bg-stone-50/70 text-stone-400 opacity-70"
                                : "border-stone-200/80 bg-white text-stone-800 hover:border-stone-300 shadow-xs"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onToggleTodo(task.id)}
                              className="mt-0.5 shrink-0 transition-transform active:scale-90"
                              aria-label={`Toggle ${task.title || task.text}`}
                            >
                              <span
                                className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                                  task.done
                                    ? "bg-emerald-500 text-white"
                                    : "border border-stone-300 hover:border-stone-400 bg-white"
                                }`}
                              >
                                {task.done && <Check size={11} strokeWidth={3} />}
                              </span>
                            </button>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-medium leading-snug break-words ${
                                  task.done ? "line-through text-stone-400" : "text-stone-900"
                                }`}
                              >
                                {task.title || task.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-stone-500">
                                <span className="inline-flex items-center gap-1 font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                  <DomainIcon size={10} />
                                  <span className="capitalize">{task.domain || task.category || "General"}</span>
                                </span>
                                {task.due && (
                                  <span className="font-mono">Due {task.due}</span>
                                )}
                                {task.time && (
                                  <span className="font-mono">{task.time}</span>
                                )}
                              </div>
                            </div>

                            {/* Move Quadrant Controls & Delete */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select
                                value={task.quadrant}
                                onChange={(e) => onMoveQuadrant(task.id, e.target.value)}
                                className="text-[10px] bg-stone-100 border border-stone-200 rounded px-1.5 py-1 text-stone-700 cursor-pointer"
                                aria-label="Move quadrant"
                              >
                                <option value="Q1">Q1</option>
                                <option value="Q2">Q2</option>
                                <option value="Q3">Q3</option>
                                <option value="Q4">Q4</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => onDeleteTodo(task.id)}
                                className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                aria-label="Delete task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick Add Input for this Quadrant */}
                <div className="mt-4 pt-3 border-t border-stone-200/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Add to ${meta.shortTitle}...`}
                      value={quickInputs[qKey] || ""}
                      onChange={(e) =>
                        setQuickInputs((prev) => ({ ...prev, [qKey]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddQuick(qKey);
                      }}
                      className="flex-1 text-xs border border-stone-200 bg-stone-50/60 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddQuick(qKey)}
                      className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-transform active:scale-[0.96]"
                      aria-label={`Add task to ${meta.shortTitle}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRIORITY RANKED VIEW (P1 -> P4) */}
      {activeTab === "priorities" && (
        <div className="space-y-4">
          {(["P1", "P2", "P3", "P4"]).map((priorityCode) => {
            const qKey = priorityCode === "P1" ? "Q1" : priorityCode === "P2" ? "Q2" : priorityCode === "P3" ? "Q3" : "Q4";
            const meta = QUADRANT_META[qKey];
            const pTasks = filteredTodos.filter((t) => t.priority === priorityCode || t.quadrant === qKey);

            return (
              <div
                key={priorityCode}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${meta.badgeClass}`}>
                      {priorityCode}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">
                      {meta.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-stone-500">
                    {pTasks.filter((t) => !t.done).length} active · {pTasks.length} total
                  </span>
                </div>

                <div className="mt-3 divide-y divide-stone-100">
                  {pTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400">
                      No tasks in this priority rank.
                    </div>
                  ) : (
                    pTasks.map((task) => (
                      <div
                        key={task.id}
                        className="py-2.5 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onToggleTodo(task.id)}
                            className="shrink-0"
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center ${
                                task.done ? "bg-emerald-500 text-white" : "border border-stone-300"
                              }`}
                            >
                              {task.done && <Check size={11} strokeWidth={3} />}
                            </span>
                          </button>
                          <span
                            className={`text-xs font-medium truncate ${
                              task.done ? "line-through text-stone-400" : "text-stone-900"
                            }`}
                          >
                            {task.title || task.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono text-[10px] capitalize">
                            {task.domain || task.category || "General"}
                          </span>
                          <select
                            value={task.quadrant}
                            onChange={(e) => onMoveQuadrant(task.id, e.target.value)}
                            className="text-[10px] bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5"
                          >
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => onDeleteTodo(task.id)}
                            className="p-1 text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
