import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Check,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Star,
  Timer,
  RotateCcw,
  Play,
  Pause,
  TrendingUp,
  Calculator,
  Award,
  Search,
  CheckCircle2,
  Circle,
  Mail,
  User,
  Megaphone,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { getCourseDetails } from "../data/georgetownCourseData";
import { GEORGETOWN_ANNOUNCEMENTS } from "./GeorgetownSubpage";

export function GeorgetownCoursePage({
  course,
  items = [],
  openItems = [],
  doneCount = 0,
  performance = [],
  average = null,
  courseDraft,
  setCourseDraft,
  performanceDraft,
  setPerformanceDraft,
  onCycleItem,
  onDeleteItem,
  onAddItem,
  onAddPerformance,
  onDeletePerformance,
  onBack,
  todos = [],
  setTodos,
}) {
  if (!course) return null;

  // Active view tab inside course: 'tasks' | 'revision' | 'syllabus' | 'grades' | 'resources'
  const [activeTab, setActiveTab] = useState("tasks");

  // Load course static details and default syllabus/revision data
  const courseDetails = useMemo(() => {
    return getCourseDetails(course.id, course.name);
  }, [course.id, course.name]);

  // Persistent Revision Schedule State
  const [revisionTopics, setRevisionTopics] = useState(() => {
    try {
      const saved = localStorage.getItem(`gt_revision_${course.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return courseDetails.defaultRevisionTopics || [];
  });

  // Persistent Syllabus Roadmap State
  const [lectureRoadmap, setLectureRoadmap] = useState(() => {
    try {
      const saved = localStorage.getItem(`gt_syllabus_${course.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return courseDetails.lectureRoadmap || [];
  });

  // Persistent Scratchpad Notes State
  const [courseNotes, setCourseNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`gt_notes_${course.id}`);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return "";
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`gt_revision_${course.id}`, JSON.stringify(revisionTopics));
    } catch {
      // ignore
    }
  }, [revisionTopics, course.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`gt_syllabus_${course.id}`, JSON.stringify(lectureRoadmap));
    } catch {
      // ignore
    }
  }, [lectureRoadmap, course.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`gt_notes_${course.id}`, courseNotes);
    } catch {
      // ignore
    }
  }, [courseNotes, course.id]);

  // Tasks Filter and Search State
  const [taskFilter, setTaskFilter] = useState("all"); // 'all' | 'dueSoon' | 'assignments' | 'quizzes' | 'readings' | 'completed'
  const [taskSearch, setTaskSearch] = useState("");

  // Revision Filter
  const [revisionFilter, setRevisionFilter] = useState("all"); // 'all' | 'dueToday' | 'upcoming' | 'mastered'

  // Add Task Modal / Inline State
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    type: "Assignment",
    title: "",
    date: "",
    time: "",
    points: "20 pts",
    weightBadge: "10% of grade",
    priority: "Normal",
    notes: "",
  });

  // Add Revision Topic State
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [newRevision, setNewRevision] = useState({
    title: "",
    module: "Module 1",
    formulaSummary: "",
    notes: "",
    keyTerms: "",
    confidence: 3,
    nextReviewDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
  });

  // Active Revision Study Timer
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState(25); // 25 or 50 mins
  const [activeTimerTopic, setActiveTimerTopic] = useState(revisionTopics[0]?.title || "");
  const [studyMinutesTotal, setStudyMinutesTotal] = useState(() => {
    try {
      return Number(localStorage.getItem(`gt_study_mins_${course.id}`)) || 145;
    } catch {
      return 145;
    }
  });

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setStudyMinutesTotal((total) => {
              const updated = total + timerMode;
              try {
                localStorage.setItem(`gt_study_mins_${course.id}`, String(updated));
              } catch {}
              return updated;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerMode, course.id]);

  // "What-If" Grade Calculator State
  const [whatIfScores, setWhatIfScores] = useState({
    midterm: 88,
    final: 92,
    assignments: 94,
    quizzes: 85,
  });

  // Calculate projected grade
  const projectedGrade = useMemo(() => {
    const weights = courseDetails.gradeWeightings;
    if (!weights || weights.length === 0) return average || 90;
    // Map categories to what-if inputs
    let totalWeight = 0;
    let earnedWeight = 0;
    weights.forEach((w) => {
      totalWeight += w.weight;
      const cat = w.category.toLowerCase();
      let score = 90;
      if (cat.includes("midterm")) score = Number(whatIfScores.midterm) || 0;
      else if (cat.includes("final")) score = Number(whatIfScores.final) || 0;
      else if (cat.includes("quiz") || cat.includes("map")) score = Number(whatIfScores.quizzes) || 0;
      else score = Number(whatIfScores.assignments) || 0;
      earnedWeight += (score * w.weight) / 100;
    });
    return totalWeight > 0 ? ((earnedWeight / totalWeight) * 100).toFixed(1) : "90.0";
  }, [whatIfScores, courseDetails.gradeWeightings, average]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return items.filter((item) => {
      if (taskSearch) {
        const query = taskSearch.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesType = item.type?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesType && !matchesNotes) return false;
      }

      if (taskFilter === "completed") return item.status === "Done" || item.status === "Graded" || item.status === "Completed";
      if (taskFilter === "dueSoon") {
        if (item.status === "Done" || item.status === "Completed") return false;
        if (!item.date) return false;
        const daysDiff = (new Date(item.date) - new Date("2026-09-07")) / (1000 * 60 * 60 * 24);
        return daysDiff >= -1 && daysDiff <= 7;
      }
      if (taskFilter === "assignments") return item.type === "Assignment" || item.type === "Case Study";
      if (taskFilter === "quizzes") return item.type === "Quiz" || item.type === "Exam";
      if (taskFilter === "readings") return item.type === "Reading";
      return true;
    });
  }, [items, taskFilter, taskSearch]);

  // Filtered Revision Topics
  const filteredRevisionTopics = useMemo(() => {
    const todayStr = "2026-09-13";
    return revisionTopics.filter((t) => {
      if (revisionFilter === "dueToday") {
        return t.nextReviewDate <= todayStr && t.stageIndex < 5;
      }
      if (revisionFilter === "upcoming") {
        return t.nextReviewDate > todayStr && t.stageIndex < 5;
      }
      if (revisionFilter === "mastered") {
        return t.stageIndex === 5 || t.confidence === 5;
      }
      return true;
    });
  }, [revisionTopics, revisionFilter]);

  // Handler to mark revision topic reviewed today
  function handleMarkReviewed(topicId) {
    const todayStr = "2026-09-13";
    setRevisionTopics((prev) =>
      prev.map((t) => {
        if (t.id !== topicId) return t;

        // Advance stage: 1 -> 2 -> 3 -> 4 -> 5
        const nextStageIdx = Math.min(5, t.stageIndex + 1);
        const stages = [
          "Stage 1: Initial Read",
          "Stage 2: Active Recall",
          "Stage 3: Spaced Problem Solving",
          "Stage 4: Past Exam Practice",
          "Stage 5: Mastered",
        ];
        const intervals = [1, 3, 7, 14, 21];
        const nextInterval = intervals[nextStageIdx - 1] || 14;

        // Calculate next date
        const d = new Date(todayStr);
        d.setDate(d.getDate() + nextInterval);
        const nextDateStr = d.toISOString().slice(0, 10);

        return {
          ...t,
          stageIndex: nextStageIdx,
          stage: stages[nextStageIdx - 1],
          lastReviewedDate: todayStr,
          nextReviewDate: nextDateStr,
          intervalDays: nextInterval,
          confidence: Math.min(5, t.confidence + 1),
          reviewedCount: (t.reviewedCount || 0) + 1,
        };
      })
    );
  }

  // Handler to update topic confidence directly
  function handleSetConfidence(topicId, starLevel) {
    setRevisionTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, confidence: starLevel } : t))
    );
  }

  // Handler to add custom revision topic
  function handleAddRevisionTopic(e) {
    e.preventDefault();
    if (!newRevision.title.trim()) return;

    const newTopic = {
      id: `rev-${Date.now()}`,
      title: newRevision.title.trim(),
      module: newRevision.module.trim() || "Module: Custom Review",
      stage: "Stage 1: Initial Read & Concept Map",
      stageIndex: 1,
      confidence: Number(newRevision.confidence) || 3,
      nextReviewDate: newRevision.nextReviewDate || "2026-09-15",
      lastReviewedDate: "2026-09-13",
      intervalDays: 3,
      formulaSummary: newRevision.formulaSummary.trim(),
      notes: newRevision.notes.trim(),
      keyTerms: newRevision.keyTerms ? newRevision.keyTerms.split(",").map((k) => k.trim()) : [],
      reviewedCount: 0,
    };

    setRevisionTopics((prev) => [newTopic, ...prev]);
    setShowAddRevision(false);
    setNewRevision({
      title: "",
      module: "Module 1",
      formulaSummary: "",
      notes: "",
      keyTerms: "",
      confidence: 3,
      nextReviewDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    });
  }

  // Handler to delete revision topic
  function handleDeleteRevisionTopic(topicId) {
    setRevisionTopics((prev) => prev.filter((t) => t.id !== topicId));
  }

  // Handler to toggle syllabus lecture progress
  function handleToggleLectureStatus(weekNum) {
    setLectureRoadmap((prev) =>
      prev.map((l) => {
        if (l.week !== weekNum) return l;
        const nextStatus = l.status === "completed" ? "in-progress" : l.status === "in-progress" ? "upcoming" : "completed";
        return { ...l, status: nextStatus };
      })
    );
  }

  // Handler to submit custom task
  function handleSubmitNewTask(e) {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    if (onAddItem) {
      if (setCourseDraft) {
        setCourseDraft({
          type: newTask.type,
          title: newTask.title.trim(),
          date: newTask.date,
          time: newTask.time,
          notes: `${newTask.points} · ${newTask.weightBadge}${newTask.notes ? ` · ${newTask.notes}` : ""}`,
        });
      }
      onAddItem();
    }

    setShowAddTask(false);
    setNewTask({
      type: "Assignment",
      title: "",
      date: "",
      time: "",
      points: "20 pts",
      weightBadge: "10% of grade",
      priority: "Normal",
      notes: "",
    });
  }

  // Format timer
  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Announcements for this course
  const announcements = GEORGETOWN_ANNOUNCEMENTS[course.id] || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl min-w-0 overflow-x-hidden mx-auto pb-16 font-sans text-[#11120F]">
      {/* =========================================================================
          TOP BREADCRUMB & COURSE HEADER
          ========================================================================= */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm ring-1 ring-stone-900/10 transition-all hover:bg-stone-900 hover:text-white"
        >
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Georgetown Courses
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#B9EAD8]/40 text-[#2F745C] border border-[#2F745C]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F745C] animate-pulse" />
            Fall 2026 Active Term
          </span>
        </div>
      </div>

      {/* Main Course Hero Card */}
      <section className="overflow-hidden rounded-3xl bg-[#181917] text-white shadow-xl">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md bg-[#B9EAD8] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#11120F]">
                  {courseDetails.code}
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {courseDetails.department} · {courseDetails.credits} Credits
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {course.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-300">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <User size={13} className="text-[#B9EAD8]" />
                  {courseDetails.professor}
                </span>
                <a
                  href={`mailto:${courseDetails.professorEmail}`}
                  className="inline-flex items-center gap-1 text-stone-400 hover:text-[#B9EAD8] transition-colors"
                >
                  <Mail size={12} />
                  {courseDetails.professorEmail}
                </a>
                <span className="inline-flex items-center gap-1 text-stone-400">
                  <Clock size={12} />
                  Office Hours: {courseDetails.officeHours}
                </span>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Tasks Open</p>
                <p className="mt-1 text-2xl font-bold text-[#B9EAD8] tabular-nums">{openItems.length}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{doneCount} completed</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Current Grade</p>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">
                  {average === null ? "—" : `${average}%`}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">Goal: {courseDetails.targetGrade}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Revision Topics</p>
                <p className="mt-1 text-2xl font-bold text-[#B9EAD8] tabular-nums">
                  {revisionTopics.filter((t) => t.stageIndex === 5).length}/{revisionTopics.length}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">Mastered</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Study Logged</p>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">{studyMinutesTotal}m</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{(studyMinutesTotal / 60).toFixed(1)} hrs total</p>
              </div>
            </div>
          </div>

          {/* Schedule Footer Strip */}
          <div className="mt-6 pt-5 border-t border-white/10 grid gap-3 sm:grid-cols-3 text-xs text-stone-300">
            <span className="inline-flex items-center gap-2">
              <Calendar size={14} className="text-[#B9EAD8]" />
              {course.meetingDays || "TBD"} · {course.startTime || "10:00"}–{course.endTime || "11:15"}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} className="text-[#B9EAD8]" />
              Georgetown Main Campus · Room {course.room || "1A04"}
            </span>
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={14} className="text-[#B9EAD8]" />
              TA: {courseDetails.ta} ({courseDetails.taEmail})
            </span>
          </div>
        </div>

        {/* Course Navigation Tab Strip */}
        <div className="bg-[#11120F] px-4 sm:px-8 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-[#B9EAD8] text-[#B9EAD8]"
                : "border-transparent text-stone-400 hover:text-white"
            }`}
          >
            <CheckCircle2 size={14} />
            Tasks & Assignments
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-white">
              {openItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("revision")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "revision"
                ? "border-[#B9EAD8] text-[#B9EAD8]"
                : "border-transparent text-stone-400 hover:text-white"
            }`}
          >
            <RotateCcw size={14} />
            Revision & Spaced Schedules
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#B9EAD8] text-[#11120F] font-bold">
              {revisionTopics.filter((t) => t.nextReviewDate <= "2026-09-13" && t.stageIndex < 5).length} Due
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "syllabus"
                ? "border-[#B9EAD8] text-[#B9EAD8]"
                : "border-transparent text-stone-400 hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            Syllabus & Lectures (15 Wks)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("grades")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "grades"
                ? "border-[#B9EAD8] text-[#B9EAD8]"
                : "border-transparent text-stone-400 hover:text-white"
            }`}
          >
            <Calculator size={14} />
            Grade Calculator & "What-If"
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "resources"
                ? "border-[#B9EAD8] text-[#B9EAD8]"
                : "border-transparent text-stone-400 hover:text-white"
            }`}
          >
            <Megaphone size={14} />
            Announcements & Notes
            {announcements.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-stone-300">
                {announcements.length}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* =========================================================================
          TAB 1: TASKS & ASSIGNMENTS
          ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: "All Tasks" },
                { key: "dueSoon", label: "Due Soon (7 Days)" },
                { key: "assignments", label: "Assignments" },
                { key: "quizzes", label: "Quizzes & Exams" },
                { key: "completed", label: "Completed" },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setTaskFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    taskFilter === pill.key
                      ? "bg-[#11120F] text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search & Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F745C]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#2F745C] text-white shadow hover:bg-[#255e4a] transition-all shrink-0"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>

          {/* Add Task Modal / Collapse */}
          {showAddTask && (
            <div className="bg-white p-5 rounded-2xl border border-stone-300 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Plus size={16} className="text-[#2F745C]" /> Add New Task or Assignment for {course.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="text-xs text-stone-400 hover:text-stone-700 font-medium"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitNewTask} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1">Task / Assignment Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Case Study 1: Liquidity Crunch Analysis"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2F745C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2F745C]"
                  >
                    <option>Assignment</option>
                    <option>Quiz</option>
                    <option>Exam</option>
                    <option>Reading</option>
                    <option>Case Study</option>
                    <option>Problem Set</option>
                    <option>Project</option>
                    <option>Study session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={newTask.time}
                    onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Points / Max Score</label>
                  <input
                    type="text"
                    placeholder="e.g. 25 pts"
                    value={newTask.points}
                    onChange={(e) => setNewTask({ ...newTask, points: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1">Notes / Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Must cite at least 3 empirical articles and include Solow steady-state diagram"
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Grade Weight Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. 15% of final grade"
                    value={newTask.weightBadge}
                    onChange={(e) => setNewTask({ ...newTask, weightBadge: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2F745C] text-white shadow hover:bg-[#255e4a]"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Check size={20} />
              </div>
              <h3 className="text-base font-bold text-stone-800">No tasks found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No tasks match your current filter. You can add a new assignment, quiz, or study deadline above.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTasks.map((item) => {
                const isCompleted = item.status === "Done" || item.status === "Completed";
                const isMissing = item.status === "Missing";

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? "border-stone-200/60 opacity-65 bg-stone-50/50"
                        : isMissing
                        ? "border-amber-300/80 bg-amber-50/20"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Checkbox / Status Cycler */}
                      <button
                        type="button"
                        onClick={() => onCycleItem?.(item.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 border ${
                          isCompleted
                            ? "bg-[#2F745C] border-[#2F745C] text-white"
                            : isMissing
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-stone-300 bg-white hover:border-[#2F745C]"
                        }`}
                        title="Click to cycle status"
                      >
                        {isCompleted ? <Check size={14} /> : <Circle size={10} className="text-stone-300" />}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                            {item.type || "Assignment"}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              isCompleted
                                ? "bg-stone-200 text-stone-600"
                                : isMissing
                                ? "bg-amber-100 text-amber-800"
                                : item.status === "In progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.status || "Planned"}
                          </span>

                          {item.weightBadge && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#B9EAD8]/40 text-[#2F745C]">
                              {item.weightBadge}
                            </span>
                          )}

                          {item.points && (
                            <span className="text-[11px] font-semibold text-stone-500 tabular-nums">
                              {item.points}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm font-semibold tracking-tight ${
                            isCompleted ? "line-through text-stone-400" : "text-stone-900"
                          }`}
                        >
                          {item.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                          {item.date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} className="text-stone-400" />
                              {item.date} {item.time ? `at ${item.time}` : ""}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-stone-500 truncate max-w-md">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onCycleItem?.(item.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                      >
                        {isCompleted ? "Re-open" : "Advance Status"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteItem?.(item.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: REVISION & SPACED REPETITION SCHEDULES
          ========================================================================= */}
      {activeTab === "revision" && (
        <div className="space-y-6">
          {/* Top Info Banner & Quick Exam Countdown */}
          <div className="grid gap-4 sm:grid-cols-3">
            {courseDetails.examMilestones.slice(0, 3).map((milestone) => {
              const daysLeft = Math.ceil(
                (new Date(milestone.date).getTime() - new Date("2026-09-13").getTime()) / (1000 * 3600 * 24)
              );

              return (
                <div
                  key={milestone.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                      {milestone.type}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        daysLeft <= 7 ? "text-amber-600" : "text-[#2F745C]"
                      }`}
                    >
                      {daysLeft > 0 ? `${daysLeft} days away` : "Today / Passed"}
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-stone-900 line-clamp-1">{milestone.title}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Date: {milestone.date} · Weight: {milestone.weight}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Active Revision Focus Timer (Pomodoro) */}
          <div className="bg-gradient-to-br from-[#181917] to-[#252824] rounded-3xl p-6 text-white shadow-md border border-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B9EAD8]">
                  <Timer size={14} /> Active Spaced Revision Session
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Focus Mode: {activeTimerTopic || "Current Topic"}
                </h3>
              </div>

              {/* Topic Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={activeTimerTopic}
                  onChange={(e) => setActiveTimerTopic(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                >
                  {revisionTopics.map((t) => (
                    <option key={t.id} value={t.title} className="bg-stone-900 text-white">
                      {t.title}
                    </option>
                  ))}
                </select>

                <div className="flex rounded-xl bg-white/10 p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setTimerMode(25);
                      setTimerSeconds(25 * 60);
                      setTimerRunning(false);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      timerMode === 25 ? "bg-[#B9EAD8] text-[#11120F]" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    25m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerMode(50);
                      setTimerSeconds(50 * 60);
                      setTimerRunning(false);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      timerMode === 50 ? "bg-[#B9EAD8] text-[#11120F]" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    50m
                  </button>
                </div>
              </div>
            </div>

            {/* Timer Display & Controls */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-baseline gap-4">
                <span className="text-5xl sm:text-6xl font-black tabular-nums tracking-tight font-mono text-white">
                  {formatTimer(timerSeconds)}
                </span>
                <span className="text-xs text-stone-400">
                  {timerRunning ? "Spaced recall in progress..." : "Paused / Ready to start"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold transition-all shadow-lg ${
                    timerRunning
                      ? "bg-amber-400 text-stone-900 hover:bg-amber-300"
                      : "bg-[#B9EAD8] text-[#11120F] hover:bg-[#a5dec9]"
                  }`}
                >
                  {timerRunning ? <Pause size={15} /> : <Play size={15} />}
                  {timerRunning ? "Pause Session" : "Start Revision"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(timerMode * 60);
                  }}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Revision Topics List Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: `All Topics (${revisionTopics.length})` },
                {
                  key: "dueToday",
                  label: `Due for Review (${
                    revisionTopics.filter((t) => t.nextReviewDate <= "2026-09-13" && t.stageIndex < 5).length
                  })`,
                },
                { key: "upcoming", label: "Upcoming (Next 7d)" },
                {
                  key: "mastered",
                  label: `Mastered (${revisionTopics.filter((t) => t.stageIndex === 5).length})`,
                },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setRevisionFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    revisionFilter === filter.key
                      ? "bg-[#11120F] text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddRevision(!showAddRevision)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#2F745C] text-white shadow hover:bg-[#255e4a] transition-all shrink-0"
            >
              <Plus size={14} /> Add Topic to Schedule
            </button>
          </div>

          {/* Add Revision Topic Form */}
          {showAddRevision && (
            <div className="bg-white p-5 rounded-2xl border border-stone-300 shadow-md animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-[#2F745C]" /> Add New Topic to Spaced Repetition Schedule
              </h3>

              <form onSubmit={handleAddRevisionTopic} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1">Topic / Theory Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diamond-Dybvig Model Derivation & Equilibrium"
                    value={newRevision.title}
                    onChange={(e) => setNewRevision({ ...newRevision, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2F745C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Course Module / Chapter</label>
                  <input
                    type="text"
                    placeholder="e.g. Module 2: Shadow Banking"
                    value={newRevision.module}
                    onChange={(e) => setNewRevision({ ...newRevision, module: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    Key Formula, Governing Rule, or Equation Summary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Haircut h = 1 - (Loan / Collateral Value). Margin spirals force fire sales."
                    value={newRevision.formulaSummary}
                    onChange={(e) => setNewRevision({ ...newRevision, formulaSummary: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1">Key Terms (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Repo haircuts, Fire sales, Tri-party repo"
                    value={newRevision.keyTerms}
                    onChange={(e) => setNewRevision({ ...newRevision, keyTerms: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Initial Confidence (1-5)</label>
                  <select
                    value={newRevision.confidence}
                    onChange={(e) => setNewRevision({ ...newRevision, confidence: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  >
                    <option value={1}>1 - Needs Fundamental Review</option>
                    <option value={2}>2 - Weak Recall</option>
                    <option value={3}>3 - Moderate Understanding</option>
                    <option value={4}>4 - Confident Application</option>
                    <option value={5}>5 - Mastered</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRevision(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2F745C] text-white shadow hover:bg-[#255e4a]"
                  >
                    Add Topic
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Revision Topics List */}
          <div className="grid gap-4">
            {filteredRevisionTopics.map((topic) => {
              const isDueToday = topic.nextReviewDate <= "2026-09-13" && topic.stageIndex < 5;
              const isMastered = topic.stageIndex === 5;

              return (
                <div
                  key={topic.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all space-y-3.5 ${
                    isDueToday
                      ? "border-amber-300 bg-amber-50/10 ring-1 ring-amber-300/40"
                      : isMastered
                      ? "border-emerald-200 bg-emerald-50/10"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {topic.module}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isDueToday
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : isMastered
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isDueToday ? "Due for Review Today" : topic.stage}
                        </span>

                        <span className="text-xs text-stone-400 tabular-nums">
                          Next review: <span className="font-semibold text-stone-700">{topic.nextReviewDate}</span>
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-stone-900 tracking-tight">{topic.title}</h4>
                    </div>

                    {/* Confidence Meter (5 Stars) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-medium text-stone-500 mr-1">Confidence:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSetConfidence(topic.id, star)}
                          className={`transition-transform hover:scale-125 ${
                            star <= topic.confidence ? "text-amber-400" : "text-stone-200"
                          }`}
                          title={`Set confidence to ${star} stars`}
                        >
                          <Star size={16} fill={star <= topic.confidence ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formula / Concept Callout */}
                  {topic.formulaSummary && (
                    <div className="rounded-xl bg-[#F0F1EE] p-3 border border-stone-200/80 text-xs font-mono text-stone-800 flex items-start gap-2">
                      <Calculator size={14} className="text-[#2F745C] shrink-0 mt-0.5" />
                      <span className="break-all">{topic.formulaSummary}</span>
                    </div>
                  )}

                  {/* Key Notes */}
                  {topic.notes && (
                    <p className="text-xs text-stone-600 leading-relaxed">
                      <span className="font-semibold text-stone-800">Review Objective: </span>
                      {topic.notes}
                    </p>
                  )}

                  {/* Key Terms Chips */}
                  {topic.keyTerms && topic.keyTerms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {topic.keyTerms.map((term, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium text-stone-600"
                        >
                          #{term}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>Reviewed {topic.reviewedCount || 0} times</span>
                      <span>•</span>
                      <span>Interval: +{topic.intervalDays || 3} days</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkReviewed(topic.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                          isDueToday
                            ? "bg-[#2F745C] text-white hover:bg-[#255e4a]"
                            : "bg-stone-100 text-stone-800 hover:bg-stone-200"
                        }`}
                      >
                        <Check size={13} />
                        Mark Reviewed Today
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRevisionTopic(topic.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete topic"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SYLLABUS & LECTURE ROADMAP (15 WEEKS)
          ========================================================================= */}
      {activeTab === "syllabus" && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Fall 2026 Semester Progression</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Week 3 of 15 completed ·{" "}
                <span className="font-semibold text-[#2F745C]">
                  {lectureRoadmap.filter((l) => l.status === "completed").length} lectures covered
                </span>
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full sm:w-64 space-y-1">
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full bg-[#2F745C] transition-all duration-500"
                  style={{
                    width: `${
                      (lectureRoadmap.filter((l) => l.status === "completed").length / lectureRoadmap.length) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 tabular-nums">
                <span>Start: Aug 23</span>
                <span>Finals: Dec 14</span>
              </div>
            </div>
          </div>

          {/* Lecture Timeline */}
          <div className="grid gap-3">
            {lectureRoadmap.map((lec) => {
              const isCompleted = lec.status === "completed";
              const isInProgress = lec.status === "in-progress";

              return (
                <div
                  key={lec.week}
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex items-start justify-between gap-4 ${
                    isCompleted
                      ? "border-stone-200/70 bg-stone-50/40"
                      : isInProgress
                      ? "border-[#2F745C] bg-[#B9EAD8]/10 ring-1 ring-[#2F745C]/30"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleLectureStatus(lec.week)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 border ${
                        isCompleted
                          ? "bg-[#2F745C] border-[#2F745C] text-white"
                          : isInProgress
                          ? "border-[#2F745C] text-[#2F745C] bg-white font-bold"
                          : "border-stone-300 bg-white hover:border-[#2F745C]"
                      }`}
                      title="Click to cycle status"
                    >
                      {isCompleted ? <Check size={14} /> : isInProgress ? "●" : <Circle size={10} className="text-stone-300" />}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          Week {lec.week}
                        </span>
                        <span className="text-xs text-stone-400 font-medium">{lec.date}</span>
                        {isInProgress && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B9EAD8] text-[#11120F]">
                            Current Week
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-bold tracking-tight ${
                          isCompleted ? "text-stone-700" : "text-stone-900"
                        }`}
                      >
                        {lec.title}
                      </h4>

                      <p className="text-xs text-stone-500">
                        <span className="font-semibold text-stone-600">Key Concepts: </span>
                        {lec.keyConcepts}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLectureStatus(lec.week)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0"
                  >
                    {isCompleted ? "Mark Incomplete" : "Mark Attended"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: GRADE CALCULATOR & "WHAT-IF"
          ========================================================================= */}
      {activeTab === "grades" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Syllabus Weights & Logged Scores */}
          <div className="space-y-6">
            <section className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Syllabus Grade Breakdown</h3>
                <span className="text-xs text-stone-500 font-medium">100% Total</span>
              </div>

              <div className="grid gap-2">
                {courseDetails.gradeWeightings.map((w, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-stone-50">
                    <span className="font-semibold text-stone-800">{w.category}</span>
                    <span className="font-mono font-bold text-[#2F745C] tabular-nums">{w.weight}%</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Performance Log */}
            <section className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Logged Assessments & Scores</h3>
                <span className="text-sm font-bold text-[#2F745C] tabular-nums">
                  Average: {average === null ? "—" : `${average}%`}
                </span>
              </div>

              {performance.length === 0 ? (
                <p className="text-xs text-stone-500 p-4 rounded-xl bg-stone-50 text-center">
                  No scores logged yet. Add your first quiz or problem set result below.
                </p>
              ) : (
                <div className="grid gap-2">
                  {performance.map((item) => {
                    const pct = ((Number(item.score) / Number(item.outOf)) * 100).toFixed(1);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50"
                      >
                        <div>
                          <p className="text-xs font-bold text-stone-900">{item.title}</p>
                          <p className="text-[11px] text-stone-400">
                            {item.date || "Fall 2026"} {item.notes ? ` · ${item.notes}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-stone-800 tabular-nums">
                            {item.score}/{item.outOf} ({pct}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeletePerformance?.(item.id)}
                            className="text-stone-300 hover:text-red-600 p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Result Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onAddPerformance?.();
                }}
                className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100"
              >
                <input
                  type="text"
                  placeholder="Assessment Title"
                  value={performanceDraft.title}
                  onChange={(e) => setPerformanceDraft({ ...performanceDraft, title: e.target.value })}
                  className="col-span-2 px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
                />
                <input
                  type="number"
                  placeholder="Score"
                  value={performanceDraft.score}
                  onChange={(e) => setPerformanceDraft({ ...performanceDraft, score: e.target.value })}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
                />
                <input
                  type="number"
                  placeholder="Out of"
                  value={performanceDraft.outOf}
                  onChange={(e) => setPerformanceDraft({ ...performanceDraft, outOf: e.target.value })}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
                />
                <button
                  type="submit"
                  className="col-span-2 py-2 rounded-xl text-xs font-bold bg-[#11120F] text-white hover:bg-stone-800 transition-colors"
                >
                  Log Result
                </button>
              </form>
            </section>
          </div>

          {/* Right: Interactive "What-If" Calculator */}
          <div className="space-y-6">
            <section className="bg-gradient-to-br from-[#181917] to-[#242722] text-white p-6 rounded-3xl shadow-lg border border-stone-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B9EAD8]">
                    <Calculator size={13} /> Grade Projection Engine
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">"What-If" Final Calculator</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">Projected Grade</p>
                  <p className="text-2xl font-black text-[#B9EAD8] tabular-nums">{projectedGrade}%</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-stone-300">Hypothetical Midterm Exam Score:</span>
                    <span className="text-[#B9EAD8] font-bold tabular-nums">{whatIfScores.midterm}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={whatIfScores.midterm}
                    onChange={(e) => setWhatIfScores({ ...whatIfScores, midterm: e.target.value })}
                    className="w-full accent-[#B9EAD8]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-stone-300">Hypothetical Final Exam Score:</span>
                    <span className="text-[#B9EAD8] font-bold tabular-nums">{whatIfScores.final}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={whatIfScores.final}
                    onChange={(e) => setWhatIfScores({ ...whatIfScores, final: e.target.value })}
                    className="w-full accent-[#B9EAD8]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-stone-300">Assignments & Problem Sets Average:</span>
                    <span className="text-[#B9EAD8] font-bold tabular-nums">{whatIfScores.assignments}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={whatIfScores.assignments}
                    onChange={(e) => setWhatIfScores({ ...whatIfScores, assignments: e.target.value })}
                    className="w-full accent-[#B9EAD8]"
                  />
                </div>
              </div>

              {/* Grade Scale Conversion */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="font-bold text-white">A</p>
                  <p className="text-[10px] text-stone-400">93–100%</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="font-bold text-white">A-</p>
                  <p className="text-[10px] text-stone-400">90–92%</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="font-bold text-white">B+</p>
                  <p className="text-[10px] text-stone-400">87–89%</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <p className="font-bold text-white">B</p>
                  <p className="text-[10px] text-stone-400">83–86%</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ANNOUNCEMENTS & COURSE NOTES
          ========================================================================= */}
      {activeTab === "resources" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Canvas Course Announcements */}
          <section className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Megaphone size={16} className="text-[#2F745C]" /> Course Announcements
              </h3>
              <span className="text-xs text-stone-400 font-medium">{announcements.length} posted</span>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-stone-500 p-8 text-center rounded-xl bg-stone-50">
                No announcements posted for this course yet.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 rounded-xl border border-stone-100 bg-stone-50 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-semibold text-stone-700">{ann.author}</span>
                      <span>{ann.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900">{ann.title}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">{ann.preview}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Scratchpad Notes */}
          <section className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileText size={16} className="text-[#2F745C]" /> Course Scratchpad & Key Notes
              </h3>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Auto-saved
              </span>
            </div>

            <textarea
              rows={12}
              placeholder="Write quick formulas, office hour questions, citation links, or exam reminders here..."
              value={courseNotes}
              onChange={(e) => setCourseNotes(e.target.value)}
              className="w-full flex-1 p-3 text-xs leading-relaxed rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2F745C]"
            />
          </section>
        </div>
      )}
    </div>
  );
}
