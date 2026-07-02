import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, Role } from "@prisma/client";
import { getSeedDatabaseUrl } from "../src/lib/db-url";
import { resolveModuleThumbnail } from "../src/lib/thumbnails";
import modulesSeed from "../src/data/modules.json";
import type { SeedModule } from "../src/lib/types";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getSeedDatabaseUrl(),
    },
  },
});

const seedModules = modulesSeed as SeedModule[];

const DEMO_USERS = [
  {
    email: "employee@demo.trainhub.local",
    password: "demo1234",
    name: "Demo Employee",
    role: Role.employee,
  },
  {
    email: "manager@demo.trainhub.local",
    password: "demo1234",
    name: "Demo Manager",
    role: Role.manager,
  },
  {
    email: "admin@demo.trainhub.local",
    password: "demo1234",
    name: "Demo Admin",
    role: Role.admin,
  },
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`${label} failed (attempt ${i}/${attempts})`);
      if (i < attempts) await sleep(2000 * i);
    }
  }
  throw lastError;
}

function printManualUserSteps() {
  console.log("\n--- Manual demo user setup (if seed keeps timing out) ---");
  console.log("1. Supabase Dashboard → Authentication → Users → Add user");
  console.log("2. Create each user (check 'Auto Confirm User'):");
  DEMO_USERS.forEach((u) => {
    console.log(`   - ${u.email} / password: ${u.password}`);
  });
  console.log("3. Copy each user's UUID from the Users table");
  console.log("4. Supabase → SQL Editor → run for each user:");
  console.log(
    "   INSERT INTO profiles (id, email, name, role, updated_at)",
  );
  console.log(
    "   VALUES ('<user-uuid>', '<email>', '<name>', '<role>', now())",
  );
  console.log(
    "   ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;",
  );
  console.log("5. Or re-run: npm run db:seed-users\n");
}

async function upsertProfile(
  userId: string,
  email: string,
  name: string,
  role: Role,
) {
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId, email, name, role },
    update: { email, name, role },
  });
}

async function seedUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn("Skipping user seed — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    printManualUserSteps();
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let failures = 0;

  for (const demo of DEMO_USERS) {
    try {
      const existingProfile = await prisma.profile.findUnique({
        where: { email: demo.email },
      });

      if (existingProfile) {
        await prisma.profile.update({
          where: { id: existingProfile.id },
          data: { name: demo.name, role: demo.role },
        });
        console.log(`Updated profile: ${demo.email}`);
        continue;
      }

      const { data, error } = await withRetries(
        `Create auth user ${demo.email}`,
        () =>
          supabase.auth.admin.createUser({
            email: demo.email,
            password: demo.password,
            email_confirm: true,
            user_metadata: { name: demo.name },
          }),
      );

      if (error) {
        const alreadyExists =
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered");

        if (alreadyExists) {
          const { data: listData } = await withRetries(
            `List users for ${demo.email}`,
            () => supabase.auth.admin.listUsers(),
          );
          const authUser = listData.users.find((u) => u.email === demo.email);
          if (authUser) {
            await upsertProfile(authUser.id, demo.email, demo.name, demo.role);
            console.log(`Linked existing auth user: ${demo.email}`);
            continue;
          }
        }

        console.error(`Failed to create ${demo.email}:`, error.message);
        failures++;
        continue;
      }

      if (data.user) {
        await upsertProfile(data.user.id, demo.email, demo.name, demo.role);
        console.log(`Created user: ${demo.email}`);
      }
    } catch (error) {
      console.error(`Failed to create ${demo.email}:`, error);
      failures++;
    }
  }

  if (failures > 0) {
    printManualUserSteps();
  }
}

async function seedModulesData() {
  for (const seed of seedModules) {
    const existing = await prisma.trainingModule.findFirst({
      where: {
        OR: [{ slug: seed.slug }, { title: seed.title }],
      },
    });

    if (existing) {
      await prisma.trainingModule.update({
        where: { id: existing.id },
        data: {
          slug: seed.slug,
          description: seed.description,
          videoUrl: seed.videoUrl,
          passThreshold: seed.passThreshold,
          durationMins: seed.durationMins,
          thumbnail: resolveModuleThumbnail(seed.thumbnail, seed.videoUrl),
          category: seed.category,
          objectives: seed.objectives,
          required: seed.required,
          maxAttempts: seed.maxAttempts,
        },
      });

      await prisma.question.deleteMany({ where: { moduleId: existing.id } });
      await prisma.question.createMany({
        data: seed.questions.map((q, index) => ({
          moduleId: existing.id,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          orderIndex: index,
        })),
      });
      console.log(`Updated module: ${seed.title}`);
      continue;
    }

    const created = await prisma.trainingModule.create({
      data: {
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        videoUrl: seed.videoUrl,
        passThreshold: seed.passThreshold,
        durationMins: seed.durationMins,
        thumbnail: resolveModuleThumbnail(seed.thumbnail, seed.videoUrl),
        category: seed.category,
        objectives: seed.objectives,
        required: seed.required,
        maxAttempts: seed.maxAttempts,
        questions: {
          create: seed.questions.map((q, index) => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            orderIndex: index,
          })),
        },
      },
    });

    console.log(`Created module: ${created.title}`);
  }
}

async function main() {
  const seedUsersOnly = process.argv.includes("--users-only");
  const dbHost = getSeedDatabaseUrl().split("@")[1]?.split("/")[0] ?? "unknown";
  console.log(`Seeding via database host: ${dbHost}`);

  if (!seedUsersOnly) {
    await seedModulesData();
  }
  await seedUsers();
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
