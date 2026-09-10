export function addRelationshipGoal(person: any, goal: any, log?: any) {
  if (!person) return person;
  const nextGoals = [...(person.goals || []), goal];
  const nextLogs = log ? [log, ...(person.logs || [])] : (person.logs || []);
  return {
    ...person,
    goals: nextGoals,
    logs: nextLogs,
  };
}

export function editRelationshipGoal(person: any, goalId: string | number, text: string, log?: any) {
  if (!person) return person;
  const nextGoals = (person.goals || []).map((g: any) =>
    g.id === goalId ? { ...g, text } : g
  );
  const nextLogs = log ? [log, ...(person.logs || [])] : (person.logs || []);
  return {
    ...person,
    goals: nextGoals,
    logs: nextLogs,
  };
}

export function toggleRelationshipGoal(person: any, goalId: string | number, log?: any) {
  if (!person) return person;
  const nextGoals = (person.goals || []).map((g: any) =>
    g.id === goalId ? { ...g, done: !g.done } : g
  );
  const nextLogs = log ? [log, ...(person.logs || [])] : (person.logs || []);
  return {
    ...person,
    goals: nextGoals,
    logs: nextLogs,
  };
}

export function deleteRelationshipGoal(person: any, goalId: string | number, log?: any) {
  if (!person) return person;
  const nextGoals = (person.goals || []).filter((g: any) => g.id !== goalId);
  const nextLogs = log ? [log, ...(person.logs || [])] : (person.logs || []);
  return {
    ...person,
    goals: nextGoals,
    logs: nextLogs,
  };
}
