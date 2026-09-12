import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { computeCpm, offsetToDate } from "../src/lib/cpm";

const prisma = new PrismaClient();

async function main() {
  await prisma.activity.deleteMany();
  await prisma.taskWatcher.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.taskComponent.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.label.deleteMany();
  await prisma.component.deleteMany();
  await prisma.version.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("password123", 10);

  const admin = await prisma.user.create({
    data: { name: "Alex Admin", email: "admin@acme.test", passwordHash, emailVerified: new Date() },
  });
  const pm = await prisma.user.create({
    data: { name: "Priya PM", email: "pm@acme.test", passwordHash, emailVerified: new Date() },
  });
  const member = await prisma.user.create({
    data: { name: "Sam Member", email: "member@acme.test", passwordHash, emailVerified: new Date() },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Acme Corp",
      slug: "acme",
      members: {
        create: [
          { userId: admin.id, role: "ADMIN" },
          { userId: pm.id, role: "PM" },
          { userId: member.id, role: "MEMBER" },
        ],
      },
    },
  });

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + 28);

  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
      key: "WEB",
      description: "Jira-style sample with board, backlog, epics, CPM.",
      status: "ACTIVE",
      startDate: start,
      deadline,
      organizationId: org.id,
      ownerId: pm.id,
      issueCounter: 0,
      members: {
        create: [{ userId: pm.id }, { userId: member.id }, { userId: admin.id }],
      },
      labels: {
        create: [
          { name: "frontend", color: "#06b6d4" },
          { name: "backend", color: "#8b5cf6" },
          { name: "urgent", color: "#ef4444" },
        ],
      },
      components: {
        create: [
          { name: "Web App", description: "Main UI" },
          { name: "API", description: "Services" },
        ],
      },
      versions: {
        create: [{ name: "v1.0", releaseDate: deadline }],
      },
    },
    include: { labels: true, components: true, versions: true },
  });

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: "Sprint 1",
      goal: "Ship redesign MVP foundation",
      status: "ACTIVE",
      startDate: start,
      endDate: new Date(start.getTime() + 14 * 86400000),
    },
  });

  async function issue(data: {
    title: string;
    issueType?: "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";
    severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE";
    durationDays?: number;
    storyPoints?: number;
    description?: string;
    isMilestone?: boolean;
    environment?: string;
    assigneeId?: string;
    epicId?: string;
    parentId?: string;
    sprintId?: string;
    sortOrder?: number;
  }) {
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { issueCounter: { increment: 1 } },
    });
    return prisma.task.create({
      data: {
        ...data,
        projectId: project.id,
        issueKey: `WEB-${updated.issueCounter}`,
        createdById: pm.id,
      },
    });
  }

  const epic = await issue({
    title: "Launch redesign",
    issueType: "EPIC",
    severity: "HIGH",
    status: "IN_PROGRESS",
    durationDays: 0,
    description: "Epic covering redesign delivery",
  });

  const specs = await issue({
    title: "Requirements & specs",
    issueType: "STORY",
    severity: "HIGH",
    durationDays: 3,
    status: "DONE",
    storyPoints: 5,
    assigneeId: pm.id,
    epicId: epic.id,
    sprintId: sprint.id,
    sortOrder: 0,
  });
  const design = await issue({
    title: "UI design system",
    issueType: "STORY",
    severity: "CRITICAL",
    durationDays: 5,
    status: "IN_PROGRESS",
    storyPoints: 8,
    assigneeId: member.id,
    epicId: epic.id,
    sprintId: sprint.id,
    sortOrder: 1,
  });
  const api = await issue({
    title: "API integration",
    issueType: "TASK",
    severity: "CRITICAL",
    durationDays: 6,
    status: "TODO",
    storyPoints: 8,
    assigneeId: member.id,
    epicId: epic.id,
    sprintId: sprint.id,
    sortOrder: 2,
  });
  const content = await issue({
    title: "Content migration",
    issueType: "TASK",
    severity: "MEDIUM",
    durationDays: 4,
    status: "BACKLOG",
    storyPoints: 3,
    assigneeId: admin.id,
    epicId: epic.id,
    sortOrder: 3,
  });
  const bug = await issue({
    title: "Header overflow on mobile",
    issueType: "BUG",
    severity: "HIGH",
    durationDays: 1,
    status: "IN_REVIEW",
    storyPoints: 2,
    assigneeId: member.id,
    epicId: epic.id,
    sprintId: sprint.id,
    environment: "staging",
    sortOrder: 4,
  });
  const qa = await issue({
    title: "QA & launch",
    issueType: "STORY",
    severity: "HIGH",
    durationDays: 3,
    status: "TODO",
    storyPoints: 5,
    assigneeId: pm.id,
    epicId: epic.id,
    sprintId: sprint.id,
    sortOrder: 5,
  });
  const launch = await issue({
    title: "Go-live",
    issueType: "TASK",
    severity: "CRITICAL",
    durationDays: 0,
    isMilestone: true,
    status: "BACKLOG",
    assigneeId: pm.id,
    epicId: epic.id,
    sortOrder: 6,
  });
  await issue({
    title: "Token audit checklist",
    issueType: "SUBTASK",
    severity: "LOW",
    durationDays: 1,
    status: "TODO",
    parentId: design.id,
    epicId: epic.id,
    sprintId: sprint.id,
    assigneeId: member.id,
    sortOrder: 7,
  });

  await prisma.taskDependency.createMany({
    data: [
      { predecessorId: specs.id, successorId: design.id },
      { predecessorId: specs.id, successorId: content.id },
      { predecessorId: design.id, successorId: api.id },
      { predecessorId: api.id, successorId: qa.id },
      { predecessorId: content.id, successorId: qa.id },
      { predecessorId: qa.id, successorId: launch.id },
      { predecessorId: bug.id, successorId: qa.id },
    ],
  });

  const frontend = project.labels.find((l) => l.name === "frontend")!;
  const backend = project.labels.find((l) => l.name === "backend")!;
  const web = project.components.find((c) => c.name === "Web App")!;
  const apiComp = project.components.find((c) => c.name === "API")!;
  const version = project.versions[0]!;

  await prisma.taskLabel.createMany({
    data: [
      { taskId: design.id, labelId: frontend.id },
      { taskId: bug.id, labelId: frontend.id },
      { taskId: bug.id, labelId: project.labels.find((l) => l.name === "urgent")!.id },
      { taskId: api.id, labelId: backend.id },
    ],
  });
  await prisma.taskComponent.createMany({
    data: [
      { taskId: design.id, componentId: web.id },
      { taskId: api.id, componentId: apiComp.id },
      { taskId: bug.id, componentId: web.id },
    ],
  });
  await prisma.task.updateMany({
    where: { id: { in: [design.id, api.id, qa.id, launch.id] } },
    data: { fixVersionId: version.id },
  });

  await prisma.taskWatcher.createMany({
    data: [
      { taskId: design.id, userId: pm.id },
      { taskId: design.id, userId: member.id },
      { taskId: bug.id, userId: admin.id },
    ],
  });

  const all = await prisma.task.findMany({
    where: { projectId: project.id, issueType: { not: "EPIC" } },
    include: { predecessors: true },
  });
  const cpm = computeCpm(
    all.map((t) => ({
      id: t.id,
      durationDays: t.isMilestone ? 0 : t.durationDays,
      predecessorIds: t.predecessors.map((p) => p.predecessorId),
    })),
  );
  for (const result of cpm.tasks) {
    await prisma.task.update({
      where: { id: result.id },
      data: {
        earlyStart: offsetToDate(start, result.earlyStart),
        earlyFinish: offsetToDate(start, result.earlyFinish),
        lateStart: offsetToDate(start, result.lateStart),
        lateFinish: offsetToDate(start, result.lateFinish),
        slackDays: result.slack,
        isCritical: result.isCritical,
        plannedStart: offsetToDate(start, result.earlyStart),
        plannedEnd: offsetToDate(start, result.earlyFinish),
      },
    });
  }

  await prisma.comment.create({
    data: {
      taskId: design.id,
      authorId: pm.id,
      body: "Align tokens with brand guidelines before handoff.",
    },
  });
  await prisma.activity.createMany({
    data: [
      {
        taskId: design.id,
        actorId: pm.id,
        action: "CREATED",
        message: "Created WEB issue",
      },
      {
        taskId: design.id,
        actorId: pm.id,
        action: "STATUS_CHANGED",
        field: "status",
        fromValue: "TODO",
        toValue: "IN_PROGRESS",
      },
      {
        taskId: bug.id,
        actorId: member.id,
        action: "COMMENTED",
        message: "Reproduced on iPhone 14",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("  admin@acme.test / password123 (ADMIN)");
  console.log("  pm@acme.test / password123 (PM)");
  console.log("  member@acme.test / password123 (MEMBER)");
  console.log(`  Project WEB: ${project.id}`);
  console.log(`  Active sprint: ${sprint.name}`);
  console.log(`  CPM duration: ${cpm.projectDuration} days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
