import React, { useState, useMemo } from "react";
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Check,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PieChart as PieChartIcon,
  Trash2,
  Sparkles,
  CreditCard,
  Building,
  User,
  ShoppingBag,
  Briefcase,
  HelpCircle,
  X,
  ChevronRight,
  Filter,
  Layers,
  Calendar,
  Share2,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  applyIncomeReceipt,
  addIncomeExpected,
  applyDebtPayment,
  addDebtPrincipal,
} from "@shared/interactionHelpers";

// Quick category icon mapper
function getIncomeIcon(from = "") {
  const f = from.toLowerCase();
  if (f.includes("job") || f.includes("salary")) return Briefcase;
  if (f.includes("sale") || f.includes("pig") || f.includes("dress")) return ShoppingBag;
  if (f.includes("bank") || f.includes("corp")) return Building;
  return DollarSign;
}

function getDebtIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("mama") || n.includes("nicole") || n.includes("jeannot") || n.includes("friend"))
    return User;
  if (n.includes("bob") || n.includes("bank") || n.includes("loan")) return Building;
  return CreditCard;
}

export function FinanceHub({
  income = [],
  setIncome,
  debts = [],
  setDebts,
  financeSub = "insights",
  setFinanceSub,
  navigate,
  fmt,
  financeInsights,
  ideasMutation,
  ideaResult,
  askIdeas,
  VoiceNoteBox,
  processVoiceNote,
  voiceLoading,
  voiceLog = [],
}) {
  // Search and view filters
  const [searchQuery, setSearchQuery] = useState("");
  const [incomeView, setIncomeView] = useState("all"); // "all" | "pending" | "received" | "date"
  const [debtView, setDebtView] = useState("all"); // "all" | "active" | "paid"

  // Dialogs & Modals
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [activeReceiveItem, setActiveReceiveItem] = useState(null);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [activeAddExpectedItem, setActiveAddExpectedItem] = useState(null);
  const [addExpectedAmount, setAddExpectedAmount] = useState("");

  const [activePayDebtItem, setActivePayDebtItem] = useState(null);
  const [payDebtAmount, setPayDebtAmount] = useState("");
  const [activeAddDebtItem, setActiveAddDebtItem] = useState(null);
  const [addDebtAmount, setAddDebtAmount] = useState("");

  // New Income form state
  const [newIncomeSource, setNewIncomeSource] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeFrom, setNewIncomeFrom] = useState("Job");
  const [newIncomeDate, setNewIncomeDate] = useState(new Date().toISOString().slice(0, 10));

  // New Debt form state
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newDebtDate, setNewDebtDate] = useState(new Date().toISOString().slice(0, 10));

  // Computed rows
  const incomeRows = useMemo(() => {
    return (income || []).map((r) => {
      const toRec = Number(r.toReceive) || 0;
      const pd = Number(r.paid) || 0;
      const remaining = Math.max(0, toRec - pd);
      const percent = toRec > 0 ? Math.min(100, Math.round((pd / toRec) * 100)) : 0;
      return {
        ...r,
        toReceive: toRec,
        paid: pd,
        remaining,
        percent,
        status: remaining <= 0 ? "Received" : "Pending",
      };
    });
  }, [income]);

  const debtRows = useMemo(() => {
    return (debts || []).map((d) => {
      const dVal = Number(d.debt) || 0;
      const pd = Number(d.paid) || 0;
      const balance = Math.max(0, dVal - pd);
      const percent = dVal > 0 ? Math.min(100, Math.round((pd / dVal) * 100)) : 0;
      return {
        ...d,
        debt: dVal,
        paid: pd,
        balance,
        percent,
        status: d.status || (balance <= 0 ? "Paid" : "Active"),
      };
    });
  }, [debts]);

  // Overall financial calculations
  const totalExpectedIncome = useMemo(
    () => incomeRows.reduce((sum, r) => sum + r.toReceive, 0),
    [incomeRows]
  );
  const totalIncomeReceived = useMemo(
    () => incomeRows.reduce((sum, r) => sum + r.paid, 0),
    [incomeRows]
  );
  const totalIncomeRemaining = useMemo(
    () => incomeRows.reduce((sum, r) => sum + r.remaining, 0),
    [incomeRows]
  );
  const incomeCollectionPercent =
    totalExpectedIncome > 0
      ? Math.round((totalIncomeReceived / totalExpectedIncome) * 100)
      : 0;

  const totalDebtOverall = useMemo(
    () => debtRows.reduce((sum, d) => sum + d.debt, 0),
    [debtRows]
  );
  const totalDebtPaid = useMemo(
    () => debtRows.reduce((sum, d) => sum + d.paid, 0),
    [debtRows]
  );
  const totalOutstandingDebt = useMemo(
    () =>
      debtRows
        .filter((d) => d.status === "Active")
        .reduce((sum, d) => sum + d.balance, 0),
    [debtRows]
  );
  const debtPayoffPercent =
    totalDebtOverall > 0
      ? Math.round((totalDebtPaid / totalDebtOverall) * 100)
      : 0;

  const netPosition = totalExpectedIncome - totalOutstandingDebt;
  const liquidPosition = totalIncomeReceived - totalOutstandingDebt;

  // Filtered Income
  const filteredIncome = useMemo(() => {
    return incomeRows
      .filter((r) => {
        if (incomeView === "pending") return r.status === "Pending";
        if (incomeView === "received") return r.status === "Received";
        return true;
      })
      .filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (r.source && r.source.toLowerCase().includes(q)) ||
          (r.from && r.from.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (incomeView === "date") return new Date(b.date) - new Date(a.date);
        return 0;
      });
  }, [incomeRows, incomeView, searchQuery]);

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return debtRows
      .filter((d) => {
        if (debtView === "active") return d.status === "Active";
        if (debtView === "paid") return d.status === "Paid";
        return true;
      })
      .filter((d) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return d.name && d.name.toLowerCase().includes(q);
      });
  }, [debtRows, debtView, searchQuery]);

  // Chart data for active debts
  const debtChartData = useMemo(() => {
    return debtRows
      .filter((d) => d.status === "Active" && d.balance > 0)
      .map((d) => ({ name: d.name, value: d.balance }));
  }, [debtRows]);

  const pieColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  // Handlers for Income
  function handleAddIncomeSubmit(e) {
    e.preventDefault();
    if (!newIncomeSource.trim() || !newIncomeAmount) return;
    const item = {
      id: Date.now(),
      source: newIncomeSource.trim(),
      toReceive: Number(newIncomeAmount),
      paid: 0,
      date: newIncomeDate || new Date().toISOString().slice(0, 10),
      from: newIncomeFrom || "Other",
    };
    setIncome((prev) => [item, ...prev]);
    setNewIncomeSource("");
    setNewIncomeAmount("");
    setShowAddIncomeModal(false);
  }

  function handleReceiveSubmit(e) {
    e?.preventDefault();
    if (!activeReceiveItem) return;
    const amt = Number(receiveAmount) || 0;
    if (amt <= 0) return;
    setIncome((prev) =>
      prev.map((r) =>
        r.id === activeReceiveItem.id
          ? { ...r, ...applyIncomeReceipt(r, amt) }
          : r
      )
    );
    setActiveReceiveItem(null);
    setReceiveAmount("");
  }

  function handleAddExpectedSubmit(e) {
    e?.preventDefault();
    if (!activeAddExpectedItem) return;
    const amt = Number(addExpectedAmount) || 0;
    if (amt <= 0) return;
    setIncome((prev) =>
      prev.map((r) =>
        r.id === activeAddExpectedItem.id
          ? { ...r, ...addIncomeExpected(r, amt) }
          : r
      )
    );
    setActiveAddExpectedItem(null);
    setAddExpectedAmount("");
  }

  function handleDeleteIncome(id) {
    setIncome((prev) => prev.filter((r) => r.id !== id));
  }

  // Handlers for Debt
  function handleAddDebtSubmit(e) {
    e.preventDefault();
    if (!newDebtName.trim() || !newDebtAmount) return;
    const item = {
      id: Date.now(),
      name: newDebtName.trim(),
      debt: Number(newDebtAmount),
      paid: 0,
      date: newDebtDate || new Date().toISOString().slice(0, 10),
      status: "Active",
    };
    setDebts((prev) => [item, ...prev]);
    setNewDebtName("");
    setNewDebtAmount("");
    setShowAddDebtModal(false);
  }

  function handlePayDebtSubmit(e) {
    e?.preventDefault();
    if (!activePayDebtItem) return;
    const amt = Number(payDebtAmount) || 0;
    if (amt <= 0) return;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== activePayDebtItem.id) return d;
        const updated = { ...d, ...applyDebtPayment(d, amt) };
        if (updated.debt - updated.paid <= 0) {
          updated.status = "Paid";
        }
        return updated;
      })
    );
    setActivePayDebtItem(null);
    setPayDebtAmount("");
  }

  function handleAddDebtPrincipalSubmit(e) {
    e?.preventDefault();
    if (!activeAddDebtItem) return;
    const amt = Number(addDebtAmount) || 0;
    if (amt <= 0) return;
    setDebts((prev) =>
      prev.map((d) =>
        d.id === activeAddDebtItem.id
          ? { ...d, ...addDebtPrincipal(d, amt) }
          : d
      )
    );
    setActiveAddDebtItem(null);
    setAddDebtAmount("");
  }

  function handleToggleDebtStatus(id) {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const nextStatus = d.status === "Active" ? "Paid" : "Active";
        return { ...d, status: nextStatus };
      })
    );
  }

  function handleDeleteDebt(id) {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-full min-w-0 overflow-x-hidden font-sans">
      {/* =========================================================================
          1. TOP CASH FLOW & NET POSITION KPI STRIP
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Net Position */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Net Position
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                netPosition >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {netPosition >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 tabular-nums font-mono">
              {fmt(netPosition)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-500">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  netPosition >= 0 ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span>
                {netPosition >= 0
                  ? "Surplus (Inflows exceed debt)"
                  : "Deficit (Debts exceed expected)"}
              </span>
            </div>
          </div>
        </div>

        {/* Total Income Collected */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Income Collected
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 tabular-nums font-mono">
                {fmt(totalIncomeReceived)}
              </p>
              <span className="text-xs font-semibold text-blue-600 tabular-nums">
                {incomeCollectionPercent}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, incomeCollectionPercent)}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5 truncate">
              of {fmt(totalExpectedIncome)} expected ({fmt(totalIncomeRemaining)} pending)
            </p>
          </div>
        </div>

        {/* Total Outstanding Debt */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Outstanding Debt
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 tabular-nums font-mono">
                {fmt(totalOutstandingDebt)}
              </p>
              <span className="text-xs font-semibold text-emerald-600 tabular-nums">
                {debtPayoffPercent}% paid
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, debtPayoffPercent)}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5 truncate">
              {fmt(totalDebtPaid)} paid of {fmt(totalDebtOverall)} total principal
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SUB-PAGE NAVIGATION TABS
          ========================================================================= */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setFinanceSub("insights");
              navigate("/finance/insights");
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              financeSub === "insights"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60"
            }`}
          >
            Insights & Overview
          </button>

          <button
            type="button"
            onClick={() => {
              setFinanceSub("income");
              navigate("/finance");
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              financeSub === "income"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60"
            }`}
          >
            <span>Income Tracker</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                financeSub === "income"
                  ? "bg-white/20 text-white"
                  : "bg-stone-200 text-stone-700"
              }`}
            >
              {incomeRows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFinanceSub("debts");
              navigate("/finance/debts");
            }}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              financeSub === "debts"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60"
            }`}
          >
            <span>Debt Tracker</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                financeSub === "debts"
                  ? "bg-white/20 text-white"
                  : "bg-stone-200 text-stone-700"
              }`}
            >
              {debtRows.filter((d) => d.status === "Active").length}
            </span>
          </button>
        </div>

        {/* AI Ideas button */}
        <button
          type="button"
          onClick={() =>
            askIdeas?.(
              "Finance strategy",
              JSON.stringify({ income: incomeRows, debts: debtRows, insights: financeInsights })
            )
          }
          disabled={ideasMutation?.isPending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100 transition-colors shrink-0"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">AI Advice</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: INSIGHTS & OVERVIEW
          ========================================================================= */}
      {financeSub === "insights" && (
        <div className="flex flex-col gap-5">
          {/* Key Metric Highlights */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3">
              Executive Financial Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700">Collection Rate</p>
                <p className="text-2xl font-bold text-stone-900 mt-1 tabular-nums">
                  {incomeCollectionPercent}%
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {fmt(totalIncomeReceived)} collected of {fmt(totalExpectedIncome)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50/70 p-4 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-700">Debt Repayment Pace</p>
                <p className="text-2xl font-bold text-stone-900 mt-1 tabular-nums">
                  {debtPayoffPercent}%
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {fmt(totalDebtPaid)} cleared of {fmt(totalDebtOverall)} original debt
                </p>
              </div>

              <div className="rounded-xl bg-purple-50/70 p-4 border border-purple-100">
                <p className="text-xs font-semibold text-purple-700">Active Creditors</p>
                <p className="text-2xl font-bold text-stone-900 mt-1 tabular-nums">
                  {debtRows.filter((d) => d.status === "Active").length}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Across {debtRows.length} total logged accounts
                </p>
              </div>
            </div>
          </div>

          {/* Active Balance Chart + Debt Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-stone-900">
                  Active Debt Distribution by Creditor
                </h3>
                <span className="text-xs font-semibold text-stone-500">
                  {debtChartData.length} Active Accounts
                </span>
              </div>

              {debtChartData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-52 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={debtChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {debtChartData.map((_, i) => (
                            <Cell key={i} fill={pieColors[i % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 text-xs">
                    {debtChartData.map((entry, idx) => {
                      const share = Math.round((entry.value / totalOutstandingDebt) * 100);
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                            />
                            <span className="font-semibold text-stone-800">{entry.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold tabular-nums text-stone-900">
                              {fmt(entry.value)}
                            </span>
                            <span className="text-stone-400 ml-1.5">({share}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No active debts remaining! You are debt free.
                </div>
              )}
            </div>

            {/* Next Recommended Actions */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-3">
                  Recommended Next Actions
                </h3>
                <div className="space-y-2.5">
                  {(financeInsights?.actions || [
                    "Follow up on pending Job Payment for RWF 1,000,000.",
                    "Allocate received Dress Sales to pay down highest balance creditor (BOB).",
                    "Keep emergency reserve before clearing non-urgent personal loans.",
                  ]).map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100"
                    >
                      <span className="mt-0.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">Need specific advice?</span>
                <button
                  type="button"
                  onClick={() =>
                    askIdeas?.(
                      "Finance advice",
                      JSON.stringify({ income: incomeRows, debts: debtRows })
                    )
                  }
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Generate Plan →
                </button>
              </div>
            </div>
          </div>

          {/* Voice update inbox */}
          {VoiceNoteBox && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 mb-2">
                Voice Financial Inbox
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                Speak any financial updates, e.g., "Received 200,000 from pig sales and paid 50,000 to Mama."
              </p>
              <VoiceNoteBox
                onSubmit={processVoiceNote}
                loading={voiceLoading}
                placeholder="Say what changed in your money, income, or debt payments…"
              />
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: INCOME TRACKER
          ========================================================================= */}
      {financeSub === "income" && (
        <div className="flex flex-col gap-4">
          {/* Top action & filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search income source or payer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter pills & Add Income button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                {[
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "received", label: "Received" },
                  { key: "date", label: "By Date" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setIncomeView(tab.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      incomeView === tab.key
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddIncomeModal(true)}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-stone-800 transition-colors"
              >
                <Plus size={14} />
                <span>Add Income</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              MOBILE CARD VIEW (< 640px)
              Guarantees zero horizontal scroll on mobile devices
              ========================================================================= */}
          <div className="sm:hidden flex flex-col gap-3">
            {filteredIncome.length > 0 ? (
              filteredIncome.map((item) => {
                const Icon = getIncomeIcon(item.from || item.source);
                const isReceived = item.status === "Received";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200/85 shadow-xs flex flex-col gap-3"
                  >
                    {/* Header: Title, Category, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {item.source}
                          </h4>
                          <p className="text-[11px] text-stone-500 truncate">
                            From: <span className="font-medium text-stone-700">{item.from}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isReceived
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Financial Progress Bar & Metrics */}
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-stone-500">Collected</span>
                        <span className="font-bold text-stone-900 tabular-nums">
                          {fmt(item.paid)} / {fmt(item.toReceive)}
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isReceived ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5">
                        <span>{item.percent}% settled</span>
                        <span>Remaining: <strong className="text-stone-800">{fmt(item.remaining)}</strong></span>
                      </div>
                    </div>

                    {/* Date and Quick Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1 text-stone-400 text-[11px]">
                        <Calendar size={12} />
                        <span>{item.date}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isReceived && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceiveItem(item);
                              setReceiveAmount(String(item.remaining));
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 size={12} /> Receive
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveAddExpectedItem(item);
                            setAddExpectedAmount("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold text-xs transition-colors"
                        >
                          + Add On
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteIncome(item.id)}
                          className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Delete income stream"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-400 text-xs">
                No income streams match your criteria.
              </div>
            )}
          </div>

          {/* =========================================================================
              DESKTOP DATA TABLE (>= 640px)
              Spacious, highly legible, wrapped with clean overflow
              ========================================================================= */}
          <div className="hidden sm:block bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto min-w-0 max-w-full">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
                    <th className="py-3 px-4">Income Source</th>
                    <th className="py-3 px-4">Expected</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Remaining</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredIncome.length > 0 ? (
                    filteredIncome.map((item) => {
                      const Icon = getIncomeIcon(item.from || item.source);
                      const isReceived = item.status === "Received";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-stone-50/70 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Icon size={14} />
                              </div>
                              <div>
                                <p className="font-semibold text-stone-900">{item.source}</p>
                                <p className="text-[11px] text-stone-500">From: {item.from}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-medium text-stone-900 tabular-nums">
                            {fmt(item.toReceive)}
                          </td>

                          <td className="py-3.5 px-4 text-stone-700 tabular-nums">
                            {fmt(item.paid)}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-stone-900 tabular-nums">
                            {fmt(item.remaining)}
                          </td>

                          <td className="py-3.5 px-4 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    isReceived ? "bg-emerald-500" : "bg-blue-600"
                                  }`}
                                  style={{ width: `${item.percent}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-stone-500 tabular-nums">
                                {item.percent}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-stone-500 text-xs">{item.date}</td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isReceived
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isReceived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReceiveItem(item);
                                    setReceiveAmount(String(item.remaining));
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition-colors"
                                >
                                  Receive
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveAddExpectedItem(item);
                                  setAddExpectedAmount("");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold text-xs transition-colors"
                              >
                                + Add On
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteIncome(item.id)}
                                className="p-1 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                        No income streams found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DEBT TRACKER
          ========================================================================= */}
      {financeSub === "debts" && (
        <div className="flex flex-col gap-4">
          {/* Top action & filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Search creditor or debt name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter pills & Add Debt button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "paid", label: "Paid Off" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDebtView(tab.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      debtView === tab.key
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddDebtModal(true)}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-stone-800 transition-colors"
              >
                <Plus size={14} />
                <span>Add Debt</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              MOBILE CARD VIEW (< 640px)
              ========================================================================= */}
          <div className="sm:hidden flex flex-col gap-3">
            {filteredDebts.length > 0 ? (
              filteredDebts.map((item) => {
                const Icon = getDebtIcon(item.name);
                const isPaid = item.status === "Paid";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200/85 shadow-xs flex flex-col gap-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 truncate">
                            Added: {item.date}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleDebtStatus(item.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-transform active:scale-95 ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {item.status}
                      </button>
                    </div>

                    {/* Payoff Progress Box */}
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-stone-500">Remaining Balance</span>
                        <span className="font-bold text-stone-900 tabular-nums">
                          {fmt(item.balance)}
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isPaid ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5">
                        <span>{item.percent}% paid</span>
                        <span>Original: <strong className="text-stone-800">{fmt(item.debt)}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-stone-400">
                        Paid: {fmt(item.paid)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePayDebtItem(item);
                              setPayDebtAmount("");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            <DollarSign size={12} /> Pay Down
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveAddDebtItem(item);
                            setAddDebtAmount("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold text-xs transition-colors"
                        >
                          + Add Debt
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDebt(item.id)}
                          className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          aria-label="Delete debt"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-400 text-xs">
                No debts match your selected filter.
              </div>
            )}
          </div>

          {/* =========================================================================
              DESKTOP DATA TABLE (>= 640px)
              ========================================================================= */}
          <div className="hidden sm:block bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto min-w-0 max-w-full">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
                    <th className="py-3 px-4">Creditor / Account</th>
                    <th className="py-3 px-4">Total Debt</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Remaining Balance</th>
                    <th className="py-3 px-4">Payoff %</th>
                    <th className="py-3 px-4">Date Added</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredDebts.length > 0 ? (
                    filteredDebts.map((item) => {
                      const Icon = getDebtIcon(item.name);
                      const isPaid = item.status === "Paid";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-stone-50/70 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isPaid
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-rose-50 text-rose-600"
                                }`}
                              >
                                <Icon size={14} />
                              </div>
                              <span className="font-semibold text-stone-900">{item.name}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-stone-700 tabular-nums">
                            {fmt(item.debt)}
                          </td>

                          <td className="py-3.5 px-4 text-stone-600 tabular-nums">
                            {fmt(item.paid)}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-stone-900 tabular-nums">
                            {fmt(item.balance)}
                          </td>

                          <td className="py-3.5 px-4 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    isPaid ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${item.percent}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-stone-500 tabular-nums">
                                {item.percent}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-stone-500 text-xs">{item.date}</td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleDebtStatus(item.id)}
                              title="Click to toggle status"
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-transform active:scale-95 ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
                              }`}
                            >
                              {item.status}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayDebtItem(item);
                                    setPayDebtAmount("");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition-colors"
                                >
                                  Pay Down
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveAddDebtItem(item);
                                  setAddDebtAmount("");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold text-xs transition-colors"
                              >
                                + Add Debt
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteDebt(item.id)}
                                className="p-1 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                        No debts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS & INTERACTIVE POPUPS (NO WINDOW.PROMPT)
          ========================================================================= */}

      {/* Modal 1: Add New Income */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Add Income Stream</h3>
              <button
                type="button"
                onClick={() => setShowAddIncomeModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddIncomeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Income Source Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Consulting Retainer, Farm Sales, Salary"
                  value={newIncomeSource}
                  onChange={(e) => setNewIncomeSource(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Expected Amount (RWF)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500000"
                    value={newIncomeAmount}
                    onChange={(e) => setNewIncomeAmount(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Payer / Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Job, Pigs, Client"
                    value={newIncomeFrom}
                    onChange={(e) => setNewIncomeFrom(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Expected / Scheduled Date
                </label>
                <input
                  type="date"
                  value={newIncomeDate}
                  onChange={(e) => setNewIncomeDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddIncomeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Debt */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Add Debt / Liability</h3>
              <button
                type="button"
                onClick={() => setShowAddDebtModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDebtSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Creditor / Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mama, BOB Bank, Nicole, Jeannot"
                  value={newDebtName}
                  onChange={(e) => setNewDebtName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Total Principal Debt (RWF)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1000000"
                    value={newDebtAmount}
                    onChange={(e) => setNewDebtAmount(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date Recorded
                  </label>
                  <input
                    type="date"
                    value={newDebtDate}
                    onChange={(e) => setNewDebtDate(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Receive Income Payment */}
      {activeReceiveItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Record Income Received</h3>
              <button
                type="button"
                onClick={() => setActiveReceiveItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 text-xs text-stone-600">
              <p className="font-semibold text-stone-900">{activeReceiveItem.source}</p>
              <p className="text-stone-500 mt-0.5">
                Remaining to receive:{" "}
                <strong className="text-emerald-700">{fmt(activeReceiveItem.remaining)}</strong>
              </p>
            </div>

            <form onSubmit={handleReceiveSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Amount Received (RWF)
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  required
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2 border border-stone-200 rounded-xl"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReceiveAmount(String(activeReceiveItem.remaining))}
                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100"
                >
                  Full Amount ({fmt(activeReceiveItem.remaining)})
                </button>
                {activeReceiveItem.remaining > 100000 && (
                  <button
                    type="button"
                    onClick={() =>
                      setReceiveAmount(String(Math.round(activeReceiveItem.remaining / 2)))
                    }
                    className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-semibold hover:bg-stone-200"
                  >
                    50% ({fmt(Math.round(activeReceiveItem.remaining / 2))})
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReceiveItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
                >
                  Confirm Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add to Expected Income */}
      {activeAddExpectedItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Increase Expected Income</h3>
              <button
                type="button"
                onClick={() => setActiveAddExpectedItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-xs text-stone-600">
              Add additional expected amount to <strong>{activeAddExpectedItem.source}</strong>.
            </p>

            <form onSubmit={handleAddExpectedSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Additional Amount (RWF)
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  required
                  placeholder="e.g. 200000"
                  value={addExpectedAmount}
                  onChange={(e) => setAddExpectedAmount(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAddExpectedItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800"
                >
                  Add Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Pay Down Debt */}
      {activePayDebtItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Make Debt Payment</h3>
              <button
                type="button"
                onClick={() => setActivePayDebtItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 text-xs text-stone-600">
              <p className="font-semibold text-stone-900">{activePayDebtItem.name}</p>
              <p className="text-stone-500 mt-0.5">
                Current remaining balance:{" "}
                <strong className="text-rose-700">{fmt(activePayDebtItem.balance)}</strong>
              </p>
            </div>

            <form onSubmit={handlePayDebtSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Payment Amount (RWF)
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  required
                  placeholder="e.g. 100000"
                  value={payDebtAmount}
                  onChange={(e) => setPayDebtAmount(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2 border border-stone-200 rounded-xl"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPayDebtAmount(String(activePayDebtItem.balance))}
                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100"
                >
                  Pay In Full ({fmt(activePayDebtItem.balance)})
                </button>
                {activePayDebtItem.balance >= 100000 && (
                  <button
                    type="button"
                    onClick={() => setPayDebtAmount("100000")}
                    className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-semibold hover:bg-stone-200"
                  >
                    100k
                  </button>
                )}
                {activePayDebtItem.balance >= 500000 && (
                  <button
                    type="button"
                    onClick={() => setPayDebtAmount("500000")}
                    className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-semibold hover:bg-stone-200"
                  >
                    500k
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePayDebtItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
                >
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Add Principal Debt */}
      {activeAddDebtItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Add to Debt Balance</h3>
              <button
                type="button"
                onClick={() => setActiveAddDebtItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-xs text-stone-600">
              Increase the principal debt balance for <strong>{activeAddDebtItem.name}</strong>.
            </p>

            <form onSubmit={handleAddDebtPrincipalSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Additional Balance (RWF)
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  required
                  placeholder="e.g. 50000"
                  value={addDebtAmount}
                  onChange={(e) => setAddDebtAmount(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAddDebtItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
                >
                  Add Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
