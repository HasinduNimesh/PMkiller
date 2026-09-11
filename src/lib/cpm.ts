/**
 * Critical Path Method (CPM) — finish-to-start dependencies.
 * Durations are in working days (calendar days for v1 simplicity).
 */

export type CpmTaskInput = {
  id: string;
  durationDays: number;
  predecessorIds: string[];
};

export type CpmTaskResult = {
  id: string;
  durationDays: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  slack: number;
  isCritical: boolean;
};

export type CpmResult = {
  tasks: CpmTaskResult[];
  projectDuration: number;
  criticalPathIds: string[];
  hasCycle: boolean;
};

function topologicalSort(
  tasks: CpmTaskInput[],
): { order: string[]; hasCycle: boolean } {
  const ids = new Set(tasks.map((t) => t.id));
  const indegree = new Map<string, number>();
  const successors = new Map<string, string[]>();

  for (const id of ids) {
    indegree.set(id, 0);
    successors.set(id, []);
  }

  for (const task of tasks) {
    for (const pred of task.predecessorIds) {
      if (!ids.has(pred)) continue;
      indegree.set(task.id, (indegree.get(task.id) ?? 0) + 1);
      successors.get(pred)!.push(task.id);
    }
  }

  const queue = [...ids].filter((id) => (indegree.get(id) ?? 0) === 0);
  const order: string[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const succ of successors.get(id) ?? []) {
      const next = (indegree.get(succ) ?? 0) - 1;
      indegree.set(succ, next);
      if (next === 0) queue.push(succ);
    }
  }

  return { order, hasCycle: order.length !== ids.size };
}

export function computeCpm(tasks: CpmTaskInput[]): CpmResult {
  if (tasks.length === 0) {
    return { tasks: [], projectDuration: 0, criticalPathIds: [], hasCycle: false };
  }

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const { order, hasCycle } = topologicalSort(tasks);

  if (hasCycle) {
    return {
      tasks: tasks.map((t) => ({
        id: t.id,
        durationDays: t.durationDays,
        earlyStart: 0,
        earlyFinish: t.durationDays,
        lateStart: 0,
        lateFinish: t.durationDays,
        slack: 0,
        isCritical: false,
      })),
      projectDuration: 0,
      criticalPathIds: [],
      hasCycle: true,
    };
  }

  const es = new Map<string, number>();
  const ef = new Map<string, number>();

  for (const id of order) {
    const task = byId.get(id)!;
    const duration = Math.max(0, task.durationDays);
    let start = 0;
    for (const pred of task.predecessorIds) {
      if (!byId.has(pred)) continue;
      start = Math.max(start, ef.get(pred) ?? 0);
    }
    es.set(id, start);
    ef.set(id, start + duration);
  }

  const projectDuration = Math.max(0, ...[...ef.values()]);

  const ls = new Map<string, number>();
  const lf = new Map<string, number>();

  const reverse = [...order].reverse();
  for (const id of reverse) {
    const task = byId.get(id)!;
    const duration = Math.max(0, task.durationDays);
    const successors = tasks.filter((t) => t.predecessorIds.includes(id));
    let finish = projectDuration;
    if (successors.length > 0) {
      finish = Math.min(...successors.map((s) => ls.get(s.id) ?? projectDuration));
    }
    lf.set(id, finish);
    ls.set(id, finish - duration);
  }

  const results: CpmTaskResult[] = order.map((id) => {
    const task = byId.get(id)!;
    const earlyStart = es.get(id) ?? 0;
    const earlyFinish = ef.get(id) ?? 0;
    const lateStart = ls.get(id) ?? 0;
    const lateFinish = lf.get(id) ?? 0;
    const slack = Math.round((lateStart - earlyStart) * 1000) / 1000;
    const isCritical = Math.abs(slack) < 1e-9;
    return {
      id,
      durationDays: task.durationDays,
      earlyStart,
      earlyFinish,
      lateStart,
      lateFinish,
      slack,
      isCritical,
    };
  });

  const criticalPathIds = results.filter((r) => r.isCritical).map((r) => r.id);

  return { tasks: results, projectDuration, criticalPathIds, hasCycle: false };
}

/** Convert day offsets from project start into Date values (calendar days). */
export function offsetToDate(projectStart: Date, dayOffset: number): Date {
  const d = new Date(projectStart);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Math.floor(dayOffset));
  return d;
}
