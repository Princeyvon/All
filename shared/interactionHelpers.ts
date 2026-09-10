export function applyIncomeReceipt(incomeRow: any, amount: number | string) {
  const num = Number(amount) || 0;
  return {
    paid: Math.max(0, (Number(incomeRow?.paid) || 0) + num),
  };
}

export function addIncomeExpected(incomeRow: any, amount: number | string) {
  const num = Number(amount) || 0;
  return {
    toReceive: Math.max(0, (Number(incomeRow?.toReceive) || 0) + num),
  };
}

export function applyDebtPayment(debtRow: any, amount: number | string) {
  const num = Number(amount) || 0;
  return {
    paid: Math.max(0, (Number(debtRow?.paid) || 0) + num),
  };
}

export function addDebtPrincipal(debtRow: any, amount: number | string) {
  const num = Number(amount) || 0;
  return {
    debt: Math.max(0, (Number(debtRow?.debt) || 0) + num),
  };
}

export function appendVoiceNote(notes: string, value: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return notes;
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const addition = `[${time}] ${trimmed}`;
  return notes ? `${notes}\n${addition}` : addition;
}

export function buildFinanceInsights(incomeRows: any[] = [], debtRows: any[] = []) {
  const totalIncomeReceived = incomeRows.reduce((acc, r) => acc + (Number(r.paid) || 0), 0);
  const totalIncomeExpected = incomeRows.reduce((acc, r) => acc + (Number(r.toReceive) || 0), 0);
  const totalDebtPaid = debtRows.reduce((acc, r) => acc + (Number(r.paid) || 0), 0);
  const totalDebtBalance = debtRows.reduce((acc, r) => acc + (Number(r.debt) || 0) - (Number(r.paid) || 0), 0);

  return {
    totalIncomeReceived,
    totalIncomeExpected,
    totalDebtPaid,
    totalDebtBalance: Math.max(0, totalDebtBalance),
    savingsRate: totalIncomeReceived > 0 ? Math.round(((totalIncomeReceived - totalDebtPaid) / totalIncomeReceived) * 100) : 0,
  };
}

export function filterTodosForProject(todos: any[] = [], projectId: string | number, projectName = "") {
  if (!projectId) return todos;
  return todos.filter((t) => {
    if (t.projectId && String(t.projectId) === String(projectId)) return true;
    if (t.project && String(t.project).toLowerCase() === String(projectName).toLowerCase()) return true;
    return false;
  });
}

export function calculateCompletionPercent(items: any[] = []) {
  if (!items || items.length === 0) return 0;
  const doneCount = items.filter((i) => i.done || i.completed).length;
  return Math.round((doneCount / items.length) * 100);
}

export function buildTodayCardItems(todayCategories: any[] = [], sources: Record<string, any[]> = {}, todayPlan: Record<string, any[]> = {}) {
  const result: Record<string, any[]> = {};
  for (const cat of todayCategories) {
    const planned = todayPlan[cat.key] || [];
    const sourceItems = sources[cat.key] || [];
    result[cat.key] = [...planned, ...sourceItems];
  }
  return result;
}

export function getDebtActionMeta(type: string) {
  if (type === "pay") {
    return {
      label: "Pay Down",
      description: "Log payment towards reducing this principal balance.",
      placeholder: "Payment $",
      amountLabel: "Payment amount",
    };
  }
  return {
    label: "Add Debt",
    description: "Increase current principal or add accrued balance.",
    placeholder: "Additional $",
    amountLabel: "Additional amount",
  };
}

export function applyVoiceActionToState(state: any, action: any, date: string, id: string) {
  if (!state || !action) return state;
  const next = { ...state };

  if (action.type === "ADD_TODO" || action.type === "ADD_TASK") {
    const newTodo = {
      id: id || Date.now(),
      title: action.title || action.text || "Voice task",
      done: false,
      date: date || new Date().toISOString().slice(0, 10),
      priority: action.priority || "P2",
      quadrant: action.quadrant || "Q2",
      category: action.category || "general",
      time: "Anytime",
    };
    next.todos = [newTodo, ...(next.todos || [])];
  } else if (action.type === "COMPLETE_TODO" || action.type === "TOGGLE_TODO") {
    const targetTitle = (action.title || action.text || "").toLowerCase();
    next.todos = (next.todos || []).map((t: any) => {
      if (t.title?.toLowerCase().includes(targetTitle)) {
        return { ...t, done: true };
      }
      return t;
    });
  }

  return next;
}
