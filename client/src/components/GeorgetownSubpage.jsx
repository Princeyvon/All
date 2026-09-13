import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Megaphone,
  MoreVertical,
  Calendar,
  Clock,
  MapPin,
  Check,
  Plus,
  Trash2,
  FileText,
  BookOpen,
  X,
  Sparkles,
  AlertCircle,
  ExternalLink,
  GraduationCap
} from "lucide-react";

// Announcements database matching screenshot counts:
// Bank Runs (5), Economic Dev (1), Intro Behavioral Econ (0), Research Project (4), Islamic World (7)
export const GEORGETOWN_ANNOUNCEMENTS = {
  "gt-bank-runs": [
    { id: "br-1", title: "Readings for Sunday: Diamond-Dybvig model and 2008 bank run comparisons", date: "Sep 5, 2026", author: "Prof. Douglas", preview: "Please review Chapter 4 of Freixas & Rochet before Sunday's lecture. We will dissect modern liquidity runs." },
    { id: "br-2", title: "Syllabus update: Guest lecture on banking regulation on Oct 12", date: "Sep 3, 2026", author: "Prof. Douglas", preview: "Former Central Bank governor will join us for an interactive Q&A on macroprudential limits." },
    { id: "br-3", title: "Office hours shifted to Thursdays 3:00–5:00 PM in Room LD03", date: "Sep 1, 2026", author: "Teaching Assistant", preview: "If you cannot make this window, please send an email to schedule an alternative appointment." },
    { id: "br-4", title: "Case Study 1 Guidelines & Rubric posted", date: "Aug 28, 2026", author: "Prof. Douglas", preview: "The rubric for the 2008 Liquidity Crunch analysis is now live in Canvas files." },
    { id: "br-5", title: "Welcome to Fall 2026: Course Overview & Required Texts", date: "Aug 24, 2026", author: "Prof. Douglas", preview: "Welcome everyone! Looking forward to an engaging semester examining crises and policy responses." },
  ],
  "gt-economic-development": [
    { id: "ed-1", title: "Policy Brief instructions & Solow growth dataset uploaded", date: "Sep 4, 2026", author: "Prof. Henderson", preview: "The empirical dataset for East African growth trajectories is now available under Files > Datasets." },
  ],
  "gt-intro-behavioral-economics": [],
  "gt-research-project-design": [
    { id: "rpd-1", title: "Reminder: Project Ideas submission deadline", date: "Sep 6, 2026", author: "Prof. Al-Mansoor", preview: "Please ensure your initial 2-page project proposal is uploaded to Canvas before midnight." },
    { id: "rpd-2", title: "Econometrics software lab access codes sent via email", date: "Sep 2, 2026", author: "IT Support", preview: "STATA and RStudio server credentials have been provisioned for all enrolled students." },
    { id: "rpd-3", title: "Group formation guidelines for final empirical project", date: "Aug 29, 2026", author: "Prof. Al-Mansoor", preview: "Groups of 2 to 3 students can be registered through the Canvas People tab." },
    { id: "rpd-4", title: "Welcome: Please complete the Setup checklist by Aug 26", date: "Aug 24, 2026", author: "Prof. Al-Mansoor", preview: "Review the course prerequisites and complete the initial research interest questionnaire." },
  ],
  "gt-islamic-world-history": [
    { id: "iw-1", title: "Quiz 1 grades released — review comments on Canvas", date: "Sep 6, 2026", author: "Prof. Tariq", preview: "Scores and personalized feedback for Quiz 1 (Early Caliphates) are now posted." },
    { id: "iw-2", title: "Reading for Wednesday: The Abbasid Golden Age & Trade Networks", date: "Sep 4, 2026", author: "Prof. Tariq", preview: "Chapters 5 & 6 from Hourani's 'A History of the Arab Peoples'." },
    { id: "iw-3", title: "Primary source analysis rubric posted", date: "Sep 1, 2026", author: "Teaching Assistant", preview: "Guidelines for assessing Ibn Battuta's travel logs are now accessible in Files." },
    { id: "iw-4", title: "Map quiz practice materials now available", date: "Aug 30, 2026", author: "Prof. Tariq", preview: "Interactive flashcards for trade routes and geographic landmarks are linked." },
    { id: "iw-5", title: "Library reserves guide for Islamic history", date: "Aug 27, 2026", author: "Georgetown Library", preview: "Digital reserve texts can be accessed with your NetID credentials." },
    { id: "iw-6", title: "Discussion section sign-ups close this Friday", date: "Aug 25, 2026", author: "Teaching Assistant", preview: "Make sure you have selected a weekly seminar slot." },
    { id: "iw-7", title: "Welcome to The Islamic World Fall 2026", date: "Aug 23, 2026", author: "Prof. Tariq", preview: "Syllabus and semester schedule overview. Looking forward to our first session on Wednesday." },
  ],
};

// Default initial academic items matching Image 2
export const DEFAULT_GEORGETOWN_ITEMS = [
  {
    id: "item-setup-checklist",
    courseId: "gt-research-project-design",
    courseName: "Research Project Design.Fall2026",
    title: "Setup checklist",
    dueDateStr: "26 Aug 2026 at 10:00 AM",
    date: "2026-08-26",
    points: "0 pts",
    status: "Missing", // "Missing" | "Due" | "Graded" | "Completed"
    type: "Assignment",
  },
  {
    id: "item-project-ideas",
    courseId: "gt-research-project-design",
    courseName: "Research Project Design.Fall2026",
    title: "Project Ideas",
    dueDateStr: "Yesterday at 11:59 PM",
    date: "2026-09-06",
    points: "10 pts",
    weightBadge: "15% of final mark",
    status: "Missing",
    type: "Assignment",
  },
  {
    id: "item-policy-brief",
    courseId: "gt-economic-development",
    courseName: "Economic Development.Fall2026",
    title: "Policy Brief Draft",
    dueDateStr: "Wed 9 Sep at 11:59 PM",
    date: "2026-09-09",
    points: "25 pts",
    weightBadge: "20% of final mark",
    status: "Due",
    type: "Assignment",
  },
  {
    id: "item-bank-case",
    courseId: "gt-bank-runs",
    courseName: "Bank Runs,Crises,Pol.Responses.Fall2026",
    title: "Case Study: 2008 Liquidity Crunch",
    dueDateStr: "Fri 11 Sep at 5:00 PM",
    date: "2026-09-11",
    points: "20 pts",
    status: "Due",
    type: "Assignment",
  },
  {
    id: "item-islamic-quiz",
    courseId: "gt-islamic-world-history",
    courseName: "The Islamic World.Fall2026",
    title: "Quiz 1: Early Caliphates",
    dueDateStr: "Graded 6 Sep",
    date: "2026-09-06",
    points: "7/11 pts",
    gradeScore: "63.64%",
    status: "Graded",
    type: "Quiz",
  },
];

// Initial Daily To-dos organized by day of week
export const DEFAULT_DAILY_TODOS = {
  "2026-09-06": [
    { id: "todo-sun-1", text: "Submit Project Ideas draft for Research Project Design", done: true, course: "Research Project Design" },
    { id: "todo-sun-2", text: "Read Diamond-Dybvig model for Bank Runs class", done: true, course: "Bank Runs" },
  ],
  "2026-09-07": [
    // Free day matching the screenshot "You're all done for now!"
  ],
  "2026-09-09": [
    { id: "todo-wed-1", text: "Complete Policy Brief Draft for Economic Development", done: false, course: "Economic Development" },
    { id: "todo-wed-2", text: "Review Abbasid Golden Age primary sources", done: false, course: "The Islamic World" },
  ],
  "2026-09-11": [
    { id: "todo-fri-1", text: "Finalize Case Study on 2008 Liquidity Crunch", done: false, course: "Bank Runs" },
  ],
};

export function GeorgetownSubpage({
  classes = [],
  courseItems = [],
  onUpdateCourseItems,
  onOpenCourse,
  today = "2026-09-07",
}) {
  // 1. Collapsible Courses state
  const [coursesOpen, setCoursesOpen] = useState(true);

  // 2. Active widget tab: "missing" | "due" | "grades"
  const [activeWidgetTab, setActiveWidgetTab] = useState("missing");

  // 3. Current week range state (default 5 Sep - 11 Sep)
  const [weekRangeLabel, setWeekRangeLabel] = useState("5 Sep - 11 Sep");

  // 4. Combined academic items: merge defaults with saved
  const [itemsList, setItemsList] = useState(() => {
    if (courseItems && courseItems.length > 0) {
      // Merge unique
      const defaultIds = new Set(DEFAULT_GEORGETOWN_ITEMS.map((d) => d.id));
      const filteredSaved = courseItems.filter((c) => !defaultIds.has(c.id));
      return [...DEFAULT_GEORGETOWN_ITEMS, ...filteredSaved];
    }
    return DEFAULT_GEORGETOWN_ITEMS;
  });

  // 5. Daily To-Dos state
  const [dailyTodos, setDailyTodos] = useState(DEFAULT_DAILY_TODOS);
  const [selectedDayDate, setSelectedDayDate] = useState("2026-09-07"); // Monday 7 Sep
  const [showCompleted, setShowCompleted] = useState(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCourse, setNewTodoCourse] = useState("Research Project Design.Fall2026");

  // 6. Announcements drawer/modal
  const [activeAnnouncementsCourse, setActiveAnnouncementsCourse] = useState(null);

  // 7. Course Actions Popover (3 dots)
  const [activeActionCourseId, setActiveActionCourseId] = useState(null);

  // 8. Add assignment modal
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
  const [newAssignmentCourseId, setNewAssignmentCourseId] = useState("gt-research-project-design");
  const [newAssignmentDue, setNewAssignmentDue] = useState("2026-09-15");
  const [newAssignmentPoints, setNewAssignmentPoints] = useState("20 pts");

  // Filter items by status
  const missingItems = useMemo(
    () => itemsList.filter((item) => item.status === "Missing"),
    [itemsList]
  );
  const dueItems = useMemo(
    () => itemsList.filter((item) => item.status === "Due"),
    [itemsList]
  );
  const gradedItems = useMemo(
    () => itemsList.filter((item) => item.status === "Graded"),
    [itemsList]
  );

  // Toggle item completion
  function handleToggleItemStatus(itemId) {
    setItemsList((prev) => {
      const updated = prev.map((item) => {
        if (item.id === itemId) {
          const nextStatus = item.status === "Completed" ? "Due" : "Completed";
          return { ...item, status: nextStatus };
        }
        return item;
      });
      onUpdateCourseItems?.(updated);
      return updated;
    });
  }

  // Add new assignment
  function handleAddAssignment(e) {
    e?.preventDefault();
    if (!newAssignmentTitle.trim()) return;

    const courseObj = coursesData.find((c) => c.id === newAssignmentCourseId);
    const newItem = {
      id: `item-${Date.now()}`,
      courseId: newAssignmentCourseId,
      courseName: courseObj ? courseObj.displayName : "Research Project Design.Fall2026",
      title: newAssignmentTitle.trim(),
      dueDateStr: newAssignmentDue,
      date: newAssignmentDue,
      points: newAssignmentPoints || "10 pts",
      status: "Due",
      type: "Assignment",
    };

    setItemsList((prev) => {
      const updated = [newItem, ...prev];
      onUpdateCourseItems?.(updated);
      return updated;
    });

    setNewAssignmentTitle("");
    setShowAddAssignmentModal(false);
  }

  // Add daily to-do
  function handleAddDailyTodo(e) {
    e?.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      done: false,
      course: newTodoCourse,
    };
    setDailyTodos((prev) => ({
      ...prev,
      [selectedDayDate]: [...(prev[selectedDayDate] || []), newTodo],
    }));
    setNewTodoText("");
    setIsAddingTodo(false);
  }

  function handleToggleDailyTodo(todoId) {
    setDailyTodos((prev) => {
      const list = prev[selectedDayDate] || [];
      const updated = list.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t));
      return { ...prev, [selectedDayDate]: updated };
    });
  }

  function handleDeleteDailyTodo(todoId) {
    setDailyTodos((prev) => {
      const list = prev[selectedDayDate] || [];
      const updated = list.filter((t) => t.id !== todoId);
      return { ...prev, [selectedDayDate]: updated };
    });
  }

  // The 5 Courses with reference styling from Image 1
  const coursesData = [
    {
      id: "gt-bank-runs",
      displayName: "Bank Runs,Crises,Pol.Responses.Fall2026",
      shortTitle: "Bank",
      subTitle: "Runs,Crises,Pol.Responses.Fall2026",
      grade: "N/A",
      announcementsCount: 5,
      // Olive green photo/architectural texture
      thumbnailBg: "bg-[#3D5C35]",
      thumbnailGradient: "from-[#2A4424] to-[#47683C]",
      textureClass: "olive-texture",
    },
    {
      id: "gt-economic-development",
      displayName: "Economic Development.Fall2026",
      shortTitle: "Economic Development.Fall2026",
      subTitle: "",
      grade: "N/A",
      announcementsCount: 1,
      // Magenta/wine marble wave
      thumbnailBg: "bg-[#9A166A]",
      thumbnailGradient: "from-[#88105B] to-[#AD1D77]",
      textureClass: "magenta-wave",
    },
    {
      id: "gt-intro-behavioral-economics",
      displayName: "Intro to Behavioral Economics.Fall2026",
      shortTitle: "Intro to Behavioral Economics.Fall2026",
      subTitle: "",
      grade: "N/A",
      announcementsCount: 0,
      // Teal curve
      thumbnailBg: "bg-[#1E748B]",
      thumbnailGradient: "from-[#135A6D] to-[#2587A1]",
      textureClass: "teal-solid",
    },
    {
      id: "gt-research-project-design",
      displayName: "Research Project Design.Fall2026",
      shortTitle: "Research Project Design.Fall2026",
      subTitle: "",
      grade: "N/A",
      announcementsCount: 4,
      // Deep oceanic teal
      thumbnailBg: "bg-[#166D82]",
      thumbnailGradient: "from-[#105566] to-[#1E7F97]",
      textureClass: "ocean-teal",
    },
    {
      id: "gt-islamic-world-history",
      displayName: "The Islamic World.Fall2026",
      shortTitle: "The Islamic World.Fall2026",
      subTitle: "",
      grade: "63.64%",
      announcementsCount: 7,
      // Mustard/ochre gold
      thumbnailBg: "bg-[#946E0A]",
      thumbnailGradient: "from-[#7C5A03] to-[#AA800D]",
      textureClass: "ochre-gold",
    },
  ];

  // Week days carousel (5 Sep - 11 Sep)
  const weekDays = [
    { dayName: "Sat", dayNum: 5, dateKey: "2026-09-05", hasDot: false },
    { dayName: "Sun", dayNum: 6, dateKey: "2026-09-06", hasDot: true },
    { dayName: "Mon", dayNum: 7, dateKey: "2026-09-07", hasDot: false },
    { dayName: "Tue", dayNum: 8, dateKey: "2026-09-08", hasDot: false },
    { dayName: "Wed", dayNum: 9, dateKey: "2026-09-09", hasDot: true },
    { dayName: "Thu", dayNum: 10, dateKey: "2026-09-10", hasDot: false },
    { dayName: "Fri", dayNum: 11, dateKey: "2026-09-11", hasDot: false },
  ];

  const currentDayTodos = (dailyTodos[selectedDayDate] || []).filter(
    (item) => showCompleted || !item.done
  );

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 font-sans text-stone-900 pb-12 min-w-0 overflow-x-hidden">
      {/* =========================================================================
          SECTION 1: TOP GREETING & ENCOURAGING QUOTE (MATCHING IMAGE 1)
          ========================================================================= */}
      <div className="px-1 pt-1">
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#1E2530] tracking-tight">
          Good night Yvon Dushimirimana!
        </h1>
        <p className="text-sm text-[#4E5A6B] mt-1 font-normal">
          Learning is a marathon, not a sprint. Be kind to yourself tonight.
        </p>
      </div>

      {/* =========================================================================
          SECTION 2: COURSES (5) COLLAPSIBLE ACCORDION & CARDS (MATCHING IMAGE 1)
          ========================================================================= */}
      <div className="space-y-3">
        {/* Header with count and chevron toggle */}
        <button
          type="button"
          onClick={() => setCoursesOpen(!coursesOpen)}
          className="w-full flex items-center justify-between text-left py-1 text-sm sm:text-base font-semibold text-[#3B4859] hover:text-[#11120F] transition-colors"
        >
          <span>Courses ({coursesData.length})</span>
          {coursesOpen ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
        </button>

        {coursesOpen && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {coursesData.map((course) => {
              const announcements = GEORGETOWN_ANNOUNCEMENTS[course.id] || [];

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl border border-stone-200/85 p-2 sm:p-2.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 relative group"
                >
                  {/* Left: Interactive Course Thumbnail with 3 dots & Grade Pill */}
                  <div
                    className={`relative w-28 sm:w-32 h-20 sm:h-22 rounded-2xl ${course.thumbnailBg} bg-gradient-to-br ${course.thumbnailGradient} flex flex-col justify-between p-2 shrink-0 shadow-inner overflow-hidden cursor-pointer`}
                    onClick={() => onOpenCourse?.(course.id)}
                    title={`Open ${course.displayName}`}
                  >
                    {/* Organic texture styling */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

                    {/* Top 3-dots button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionCourseId(
                          activeActionCourseId === course.id ? null : course.id
                        );
                      }}
                      className="w-6 h-6 rounded-full bg-white/95 text-stone-700 hover:bg-white flex items-center justify-center shadow-sm z-10 transition-transform active:scale-95 cursor-pointer"
                      aria-label={`Options for ${course.displayName}`}
                    >
                      <MoreVertical size={13} strokeWidth={2.5} />
                    </button>

                    {/* Bottom Grade Pill */}
                    <div className="z-10 self-start">
                      <span className="inline-block bg-white/95 text-stone-800 font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
                        {course.grade}
                      </span>
                    </div>

                    {/* Popover Action Menu */}
                    {activeActionCourseId === course.id && (
                      <div
                        className="absolute left-2 top-9 z-30 bg-white rounded-2xl border border-stone-200 shadow-xl p-1.5 w-44 text-left text-xs font-semibold text-stone-700 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionCourseId(null);
                            onOpenCourse?.(course.id);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 flex items-center gap-2"
                        >
                          <BookOpen size={13} className="text-[#9A166A]" /> View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionCourseId(null);
                            setActiveAnnouncementsCourse(course);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 flex items-center gap-2"
                        >
                          <Megaphone size={13} className="text-[#9A166A]" /> Announcements ({course.announcementsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionCourseId(null);
                            setNewAssignmentCourseId(course.id);
                            setShowAddAssignmentModal(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 flex items-center gap-2"
                        >
                          <Plus size={13} className="text-[#9A166A]" /> Add Assignment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Middle: Course Title */}
                  <div
                    className="flex-1 min-w-0 pr-2 cursor-pointer"
                    onClick={() => onOpenCourse?.(course.id)}
                  >
                    <h3 className="text-xs sm:text-[14.5px] font-bold text-[#1E2530] leading-snug tracking-tight hover:text-[#9A166A] transition-colors line-clamp-2">
                      {course.displayName}
                    </h3>
                  </div>

                  {/* Right: Megaphone Notification Icon & Purple Pill Badge */}
                  <div className="shrink-0 pr-2 sm:pr-3 flex items-center">
                    {course.announcementsCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setActiveAnnouncementsCourse(course)}
                        className="relative p-1.5 rounded-full hover:bg-stone-100 transition-colors group/btn cursor-pointer"
                        title={`${course.announcementsCount} announcements`}
                      >
                        {/* Gray Megaphone */}
                        <Megaphone
                          size={22}
                          className="text-[#64748B] group-hover/btn:text-[#334155] -rotate-12 transition-transform group-hover/btn:scale-105"
                        />
                        {/* Purple/Plum notification circle */}
                        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-[#8E1763] text-white text-[10px] font-black flex items-center justify-center px-1 shadow-sm">
                          {course.announcementsCount}
                        </span>
                      </button>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3: PLUM / MAGENTA WEEKLY STATUS WIDGET (MATCHING IMAGE 2)
          ========================================================================= */}
      <div className="bg-[#9A166A] rounded-[32px] p-4 sm:p-5 text-white shadow-xl shadow-[#9A166A]/20">
        {/* Top Date Range Header with Prev/Next Navigation */}
        <div className="flex items-center justify-between px-2 mb-3.5">
          <button
            type="button"
            onClick={() => setWeekRangeLabel("29 Aug - 4 Sep")}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm sm:text-base font-bold tracking-wide">
            {weekRangeLabel}
          </span>

          <button
            type="button"
            onClick={() => setWeekRangeLabel("12 Sep - 18 Sep")}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 3 Metric Tab Capsules (Matching Image 2 segmented layout) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/10 rounded-2xl mb-3.5">
          {/* Tab 1: Missing */}
          <button
            type="button"
            onClick={() => setActiveWidgetTab("missing")}
            className={`py-2 px-1 sm:px-2 rounded-xl text-center transition-all cursor-pointer ${
              activeWidgetTab === "missing"
                ? "bg-white text-[#11120F] shadow-md scale-[1.01]"
                : "text-white/85 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center gap-1 font-bold text-base sm:text-lg">
              <span>{missingItems.length}</span>
              {activeWidgetTab === "missing" ? (
                <ChevronUp size={14} className="text-stone-700" />
              ) : (
                <ChevronDown size={14} className="text-white/70" />
              )}
            </div>
            <span
              className={`block text-[11px] sm:text-xs font-semibold ${
                activeWidgetTab === "missing" ? "text-[#5F625D]" : "text-white/80"
              }`}
            >
              Missing
            </span>
          </button>

          {/* Tab 2: Due */}
          <button
            type="button"
            onClick={() => setActiveWidgetTab("due")}
            className={`py-2 px-1 sm:px-2 rounded-xl text-center transition-all cursor-pointer ${
              activeWidgetTab === "due"
                ? "bg-white text-[#11120F] shadow-md scale-[1.01]"
                : "text-white/85 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center gap-1 font-bold text-base sm:text-lg">
              <span>{dueItems.length}</span>
              {activeWidgetTab === "due" ? (
                <ChevronUp size={14} className="text-stone-700" />
              ) : (
                <ChevronDown size={14} className="text-white/70" />
              )}
            </div>
            <span
              className={`block text-[11px] sm:text-xs font-semibold ${
                activeWidgetTab === "due" ? "text-[#5F625D]" : "text-white/80"
              }`}
            >
              Due
            </span>
          </button>

          {/* Tab 3: New Grades */}
          <button
            type="button"
            onClick={() => setActiveWidgetTab("grades")}
            className={`py-2 px-1 sm:px-2 rounded-xl text-center transition-all cursor-pointer ${
              activeWidgetTab === "grades"
                ? "bg-white text-[#11120F] shadow-md scale-[1.01]"
                : "text-white/85 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center gap-1 font-bold text-base sm:text-lg">
              <span>{gradedItems.length}</span>
              {activeWidgetTab === "grades" ? (
                <ChevronUp size={14} className="text-stone-700" />
              ) : (
                <ChevronDown size={14} className="text-white/70" />
              )}
            </div>
            <span
              className={`block text-[11px] sm:text-xs font-semibold ${
                activeWidgetTab === "grades" ? "text-[#5F625D]" : "text-white/80"
              }`}
            >
              New Grades
            </span>
          </button>
        </div>

        {/* White Inner Card Displaying Items for Active Tab */}
        <div className="bg-white rounded-2xl p-4 text-stone-900 shadow-sm space-y-3.5">
          {/* Active Tab Content: MISSING */}
          {activeWidgetTab === "missing" && (
            <div className="divide-y divide-stone-100">
              {missingItems.length > 0 ? (
                missingItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 ${idx > 0 ? "pt-3.5" : ""} pb-1`}
                  >
                    {/* Turquoise Document Icon */}
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} strokeWidth={2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Course tag with teal border indicator */}
                      <button
                        type="button"
                        onClick={() => onOpenCourse?.(item.courseId)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors text-left"
                      >
                        <span className="w-0.5 h-3 bg-teal-600 rounded-full" />
                        <span className="truncate">{item.courseName}</span>
                      </button>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                        {item.title}
                      </h4>

                      {/* Date */}
                      <p className="text-xs text-stone-500 mt-0.5 font-normal">
                        {item.dueDateStr}
                      </p>

                      {/* Points and Weight Badge */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium text-stone-600">
                          {item.points}
                        </span>

                        {item.weightBadge && (
                          <span className="text-[11px] font-semibold text-teal-700 border border-teal-300/80 bg-teal-50/50 px-2.5 py-0.5 rounded-full">
                            {item.weightBadge}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleItemStatus(item.id)}
                          className="ml-auto text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check size={12} /> Mark Done
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 py-3 text-center">
                  No missing assignments! You are all caught up.
                </p>
              )}
            </div>
          )}

          {/* Active Tab Content: DUE */}
          {activeWidgetTab === "due" && (
            <div className="divide-y divide-stone-100">
              {dueItems.length > 0 ? (
                dueItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 ${idx > 0 ? "pt-3.5" : ""} pb-1`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} strokeWidth={2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenCourse?.(item.courseId)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#8E1763] hover:text-[#5c0f40] transition-colors text-left"
                      >
                        <span className="w-0.5 h-3 bg-[#8E1763] rounded-full" />
                        <span className="truncate">{item.courseName}</span>
                      </button>

                      <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                        {item.title}
                      </h4>

                      <p className="text-xs text-stone-500 mt-0.5 font-normal">
                        Due: {item.dueDateStr}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium text-stone-600">
                          {item.points}
                        </span>

                        {item.weightBadge && (
                          <span className="text-[11px] font-semibold text-[#8E1763] border border-[#8E1763]/30 bg-[#8E1763]/5 px-2.5 py-0.5 rounded-full">
                            {item.weightBadge}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleItemStatus(item.id)}
                          className="ml-auto text-xs font-semibold text-stone-700 hover:text-emerald-700 bg-stone-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check size={12} /> Submit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 py-3 text-center">
                  No upcoming deadlines this week.
                </p>
              )}
            </div>
          )}

          {/* Active Tab Content: NEW GRADES */}
          {activeWidgetTab === "grades" && (
            <div className="divide-y divide-stone-100">
              {gradedItems.length > 0 ? (
                gradedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 ${idx > 0 ? "pt-3.5" : ""} pb-1`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <GraduationCap size={18} strokeWidth={2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenCourse?.(item.courseId)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors text-left"
                      >
                        <span className="w-0.5 h-3 bg-emerald-600 rounded-full" />
                        <span className="truncate">{item.courseName}</span>
                      </button>

                      <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                        {item.title}
                      </h4>

                      <p className="text-xs text-stone-500 mt-0.5 font-normal">
                        Score: <strong>{item.points}</strong> ({item.gradeScore})
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          Graded · {item.gradeScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 py-3 text-center">
                  No new grades reported this week.
                </p>
              )}
            </div>
          )}

          {/* Quick Action to Add an Assignment */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              Canvas Synced · Fall 2026
            </span>
            <button
              type="button"
              onClick={() => setShowAddAssignmentModal(true)}
              className="text-xs font-bold text-[#9A166A] hover:underline flex items-center gap-1"
            >
              <Plus size={13} /> Add Assignment
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: DAILY TO-DO (MATCHING IMAGE 2)
          ========================================================================= */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-[#1E2530] mb-2 px-1">
          Daily To-do
        </h2>

        <div className="bg-white rounded-[32px] border border-stone-200/90 p-4 sm:p-6 shadow-sm">
          {/* Top Row: Month Header & Show Completed Switch */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-xl sm:text-2xl font-black text-[#1E2530] tracking-tight">
              September
            </h3>

            {/* Custom Toggle Switch matching screenshot: "Show Completed [ (X) ]" */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[#8E1763]">
                Show Completed
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showCompleted}
                onClick={() => setShowCompleted(!showCompleted)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  showCompleted ? "bg-[#8E1763]" : "bg-slate-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-md transition-transform duration-200 ${
                    showCompleted ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {showCompleted ? (
                    <Check size={12} strokeWidth={2.5} className="text-[#8E1763]" />
                  ) : (
                    <X size={12} strokeWidth={2.5} className="text-slate-600" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Week Day Carousel matching image with plum circle and dots */}
          <div className="flex items-center justify-between gap-1 py-4 border-b border-stone-100/90">
            {/* Left magenta arrow button */}
            <button
              type="button"
              onClick={() => {}}
              className="w-7 h-7 rounded-full bg-[#9A166A] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Week days columns */}
            <div className="flex items-center justify-around flex-1 px-1">
              {weekDays.map((wd) => {
                const isSelected = selectedDayDate === wd.dateKey;

                return (
                  <button
                    key={wd.dayNum}
                    type="button"
                    onClick={() => setSelectedDayDate(wd.dateKey)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <span className="text-[11px] font-semibold text-stone-500 group-hover:text-stone-800">
                      {wd.dayName}
                    </span>

                    {/* Day number badge */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isSelected
                          ? "bg-[#9A166A] text-white shadow-md shadow-[#9A166A]/30"
                          : "text-stone-800 hover:bg-stone-100"
                      }`}
                    >
                      {wd.dayNum}
                    </div>

                    {/* Notification dot */}
                    <div className="h-1.5 flex items-center justify-center">
                      {wd.hasDot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9A166A]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right magenta arrow button */}
            <button
              type="button"
              onClick={() => {}}
              className="w-7 h-7 rounded-full bg-[#9A166A] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Content area for selected day */}
          <div className="pt-5">
            {currentDayTodos.length === 0 ? (
              /* Mascot state matching screenshot: "You're all done for now!" */
              <div className="flex flex-col items-center text-center py-4 px-2 animate-in fade-in">
                {/* SVG Mascot relaxing in hammock */}
                <div className="w-36 h-20 relative mb-3 flex items-center justify-center">
                  <svg viewBox="0 0 160 80" className="w-full h-full">
                    {/* Palm trunks / posts */}
                    <path
                      d="M15 70 Q 20 40 25 10"
                      stroke="#8D6E63"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M145 70 Q 140 40 135 10"
                      stroke="#8D6E63"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Hammock ropes */}
                    <path
                      d="M25 22 Q 40 40 50 48"
                      stroke="#A1887F"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M135 22 Q 120 40 110 48"
                      stroke="#A1887F"
                      strokeWidth="2"
                      fill="none"
                    />

                    {/* Hammock net (cyan / blue) */}
                    <path
                      d="M38 32 Q 80 66 122 32 C 108 58 52 58 38 32 Z"
                      fill="#0288D1"
                      opacity="0.9"
                    />
                    <path
                      d="M44 36 Q 80 62 116 36"
                      stroke="#E1F5FE"
                      strokeWidth="1.5"
                      fill="none"
                    />

                    {/* Mascot body inside hammock */}
                    <ellipse cx="80" cy="42" rx="20" ry="12" fill="#ECEFF1" />
                    {/* Mascot blue shirt */}
                    <path d="M72 40 Q 80 47 88 40" fill="#1976D2" />

                    {/* Mascot head */}
                    <circle cx="66" cy="35" r="11" fill="#FFCC80" />
                    {/* Hardhat / cap (yellow) */}
                    <path
                      d="M55 33 Q 66 22 77 33 Z"
                      fill="#FBC02D"
                      stroke="#F57F17"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="53"
                      y="32"
                      width="26"
                      height="3"
                      rx="1.5"
                      fill="#F57F17"
                    />

                    {/* Sunglasses */}
                    <rect x="62" y="34" width="7" height="4.5" rx="2" fill="#212121" />
                    <rect x="70" y="34" width="7" height="4.5" rx="2" fill="#212121" />
                    <line x1="68" y1="36" x2="71" y2="36" stroke="#212121" strokeWidth="1.5" />

                    {/* Content smile */}
                    <path
                      d="M66 41 Q 70 43 73 41"
                      stroke="#D84315"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  </svg>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-[#1E2530]">
                  You're all done for now!
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xs leading-relaxed">
                  Looks like you're free for this day. Do you want to add some To-dos?
                </p>

                {/* Magenta Add To-do pill button */}
                <button
                  type="button"
                  onClick={() => setIsAddingTodo(true)}
                  className="mt-4 px-5 py-2.5 rounded-full bg-[#9A166A] text-white text-xs sm:text-sm font-bold tracking-wide hover:brightness-110 active:scale-95 shadow-md shadow-[#9A166A]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} /> Add To-do
                </button>
              </div>
            ) : (
              /* Tasks List for Selected Day */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    {currentDayTodos.length} Tasks Scheduled
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTodo(true)}
                    className="text-xs font-bold text-[#9A166A] hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add another
                  </button>
                </div>

                {currentDayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/60 hover:bg-white hover:border-stone-300 transition-all"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={todo.done}
                        onChange={() => handleToggleDailyTodo(todo.id)}
                        className="w-4 h-4 rounded text-[#9A166A] focus:ring-[#9A166A] accent-[#9A166A] cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs sm:text-sm font-medium ${
                            todo.done ? "line-through text-stone-400" : "text-stone-800"
                          }`}
                        >
                          {todo.text}
                        </p>
                        {todo.course && (
                          <span className="text-[10px] font-semibold text-[#8E1763] bg-[#8E1763]/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            {todo.course}
                          </span>
                        )}
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteDailyTodo(todo.id)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition-colors ml-2"
                      aria-label="Delete todo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add To-do Input form */}
            {isAddingTodo && (
              <form
                onSubmit={handleAddDailyTodo}
                className="mt-4 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl animate-in fade-in"
              >
                <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Add Daily To-do
                </h5>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g., Read Chapter 4 of Behavioral Economics"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#9A166A]"
                    autoFocus
                  />
                  <select
                    value={newTodoCourse}
                    onChange={(e) => setNewTodoCourse(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-white text-stone-700"
                  >
                    {coursesData.map((c) => (
                      <option key={c.id} value={c.displayName}>
                        {c.displayName}
                      </option>
                    ))}
                    <option value="General Study">General Study / Admin</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTodo(false);
                      setNewTodoText("");
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs text-stone-500 hover:bg-stone-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#9A166A] text-white text-xs font-bold hover:brightness-110"
                  >
                    Save To-do
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ANNOUNCEMENTS MODAL / DRAWER
          ========================================================================= */}
      {activeAnnouncementsCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#8E1763]/10 text-[#8E1763] flex items-center justify-center shrink-0">
                  <Megaphone size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-stone-900 truncate">
                    Course Announcements
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate">
                    {activeAnnouncementsCourse.displayName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAnnouncementsCourse(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-stone-100">
              {(GEORGETOWN_ANNOUNCEMENTS[activeAnnouncementsCourse.id] || []).length > 0 ? (
                (GEORGETOWN_ANNOUNCEMENTS[activeAnnouncementsCourse.id] || []).map((ann, i) => (
                  <div key={ann.id} className={i > 0 ? "pt-3.5" : ""}>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span className="font-semibold text-[#8E1763]">{ann.author}</span>
                      <span>{ann.date}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {ann.preview}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 text-center py-6">
                  No announcements published for this course yet.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveAnnouncementsCourse(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD ASSIGNMENT MODAL
          ========================================================================= */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleAddAssignment}
            className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Add Academic Assignment
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAssignmentModal(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Course
              </label>
              <select
                value={newAssignmentCourseId}
                onChange={(e) => setNewAssignmentCourseId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
              >
                {coursesData.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g., Problem Set 2 or Final Essay Proposal"
                value={newAssignmentTitle}
                onChange={(e) => setNewAssignmentTitle(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#9A166A]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newAssignmentDue}
                  onChange={(e) => setNewAssignmentDue(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Points / Weight
                </label>
                <input
                  type="text"
                  placeholder="e.g., 20 pts"
                  value={newAssignmentPoints}
                  onChange={(e) => setNewAssignmentPoints(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowAddAssignmentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#9A166A] text-white text-xs font-bold hover:brightness-110"
              >
                Add to Canvas
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
