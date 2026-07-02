import modulesSeed from "@/data/modules.json";
import { prisma } from "./prisma";
import type { ProgressStatus, SeedModule } from "./types";

export const seedModules = modulesSeed as SeedModule[];

const moduleCatalogSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  category: true,
  durationMins: true,
  thumbnail: true,
  required: true,
} as const;

function isDbUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Error querying the database") ||
    error.message.includes("DATABASE_URL is not set")
  );
}

async function safeDbQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    if (isDbUnavailable(error)) return null;
    throw error;
  }
}

function getSeedModule(moduleKey: string) {
  return seedModules.find((module) => module.slug === moduleKey) ?? null;
}

/** Stable URL segment: slug when present, otherwise internal id. */
export function getModuleRouteKey(module: { id: string; slug?: string | null }) {
  return module.slug ?? module.id;
}

function catalogFromSeed() {
  return seedModules.map((module) => ({
    id: module.slug,
    slug: module.slug,
    title: module.title,
    description: module.description,
    category: module.category,
    durationMins: module.durationMins,
    thumbnail: module.thumbnail,
    required: module.required,
    progress: null as {
      status: ProgressStatus;
      attemptCount: number;
    } | null,
  }));
}

function videoFromSeed(moduleKey: string) {
  const seed = getSeedModule(moduleKey);
  if (!seed) return null;

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    videoUrl: seed.videoUrl,
    objectives: seed.objectives,
    progress: null as {
      videoAcknowledged: boolean;
      status: ProgressStatus;
      attemptCount: number;
    } | null,
  };
}

async function findTrainingModule(moduleKey: string) {
  return safeDbQuery(() =>
    prisma.trainingModule.findFirst({
      where: {
        OR: [{ id: moduleKey }, { slug: moduleKey }],
      },
    }),
  );
}

export async function getCatalogModules(userId?: string) {
  const modules = await safeDbQuery(() =>
    prisma.trainingModule.findMany({
      select: moduleCatalogSelect,
      orderBy: { createdAt: "asc" },
    }),
  );

  if (!modules) {
    return catalogFromSeed();
  }

  if (!userId) {
    return modules.map((module) => ({
      ...module,
      progress: null as {
        status: ProgressStatus;
        attemptCount: number;
      } | null,
    }));
  }

  const progresses = await safeDbQuery(() =>
    prisma.moduleProgress.findMany({
      where: { userId },
      select: { moduleId: true, status: true, attemptCount: true },
    }),
  );

  const progressMap = new Map(
    (progresses ?? []).map((progress) => [progress.moduleId, progress]),
  );

  return modules.map((module) => {
    const progress = progressMap.get(module.id);
    return {
      ...module,
      progress: progress
        ? {
            status: progress.status as ProgressStatus,
            attemptCount: progress.attemptCount,
          }
        : null,
    };
  });
}

export async function getModuleForVideo(moduleKey: string, userId?: string) {
  const trainingModule = await safeDbQuery(() =>
    prisma.trainingModule.findFirst({
      where: {
        OR: [{ id: moduleKey }, { slug: moduleKey }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        videoUrl: true,
        objectives: true,
      },
    }),
  );

  if (trainingModule) {
    let progress = null;
    if (userId) {
      progress = await safeDbQuery(() =>
        prisma.moduleProgress.findUnique({
          where: {
            userId_moduleId: { userId, moduleId: trainingModule.id },
          },
          select: { videoAcknowledged: true, status: true, attemptCount: true },
        }),
      );
    }

    return {
      ...trainingModule,
      progress: progress ?? null,
    };
  }

  return videoFromSeed(moduleKey);
}

export async function getModuleForQuiz(moduleKey: string, userId?: string) {
  const trainingModule = await safeDbQuery(() =>
    prisma.trainingModule.findFirst({
      where: {
        OR: [{ id: moduleKey }, { slug: moduleKey }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        durationMins: true,
        maxAttempts: true,
        questions: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, text: true, options: true },
        },
      },
    }),
  );

  if (trainingModule) {
    let progress = null;
    if (userId) {
      progress = await safeDbQuery(() =>
        prisma.moduleProgress.findUnique({
          where: {
            userId_moduleId: { userId, moduleId: trainingModule.id },
          },
          select: { status: true, attemptCount: true },
        }),
      );
    }

    return { ...trainingModule, progress: progress ?? null };
  }

  const seed = getSeedModule(moduleKey);
  if (!seed) return null;

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    durationMins: seed.durationMins,
    maxAttempts: seed.maxAttempts,
    questions: seed.questions.map((question, index) => ({
      id: `${seed.slug}-q${index}`,
      text: question.text,
      options: question.options,
    })),
    progress: null,
  };
}

export async function resolveModuleRecord(moduleKey: string) {
  const fromDb = await findTrainingModule(moduleKey);
  if (fromDb) return fromDb;

  const seed = getSeedModule(moduleKey);
  if (!seed) return null;

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    passThreshold: seed.passThreshold,
    maxAttempts: seed.maxAttempts,
  };
}

export async function getModuleById(moduleKey: string, userId?: string) {
  return getModuleForVideo(moduleKey, userId);
}

export async function getAttemptById(attemptId: string) {
  return safeDbQuery(() =>
    prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        module: {
          include: {
            questions: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    }),
  );
}
