import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Full system administrator" },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: { name: "manager", description: "Team manager with elevated access" },
  });

  const developerRole = await prisma.role.upsert({
    where: { name: "developer" },
    update: {},
    create: { name: "developer", description: "Developer who connects repos and views alerts" },
  });

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: "admin@securepulse.dev" },
    update: {},
    create: {
      email: "admin@securepulse.dev",
      name: "Admin User",
      userRoles: { create: { roleId: adminRole.id } },
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: "developer@securepulse.dev" },
    update: {},
    create: {
      email: "developer@securepulse.dev",
      name: "Dev User",
      userRoles: { create: { roleId: developerRole.id } },
    },
  });

  // Create sample repos for admin
  const repo1 = await prisma.gitHubRepository.upsert({
    where: { userId_fullName: { userId: admin.id, fullName: "securepulse/backend" } },
    update: {},
    create: {
      userId: admin.id,
      repoName: "backend",
      repoUrl: "https://github.com/securepulse/backend",
      fullName: "securepulse/backend",
      visibility: "private",
      defaultBranch: "main",
      language: "TypeScript",
      description: "SecurePulse backend API",
    },
  });

  const repo2 = await prisma.gitHubRepository.upsert({
    where: { userId_fullName: { userId: admin.id, fullName: "securepulse/frontend" } },
    update: {},
    create: {
      userId: admin.id,
      repoName: "frontend",
      repoUrl: "https://github.com/securepulse/frontend",
      fullName: "securepulse/frontend",
      visibility: "public",
      defaultBranch: "main",
      language: "TypeScript",
      description: "SecurePulse frontend dashboard",
    },
  });

  // Create sample scans
  const scan1 = await prisma.repositoryScan.create({
    data: {
      githubRepoId: repo1.id,
      scanType: "scan-github",
      status: "completed",
      completedAt: new Date(),
    },
  });

  const scan2 = await prisma.repositoryScan.create({
    data: {
      githubRepoId: repo2.id,
      scanType: "scan-sast",
      status: "completed",
      completedAt: new Date(),
    },
  });

  // Create sample alerts
  await prisma.alert.createMany({
    data: [
      {
        scanId: scan1.id,
        severity: "critical",
        title: "AWS Secret Key Exposed",
        description: "Found AWS secret access key in source code",
        filePath: "src/config/aws.ts",
        lineNumber: 15,
        status: "open",
      },
      {
        scanId: scan1.id,
        severity: "high",
        title: "API Key in Environment",
        description: "API key hardcoded instead of using environment variable",
        filePath: "src/services/payment.ts",
        lineNumber: 42,
        status: "open",
      },
      {
        scanId: scan2.id,
        severity: "medium",
        title: "SQL Injection Risk",
        description: "Unparameterized SQL query detected",
        filePath: "src/db/queries.ts",
        lineNumber: 88,
        status: "open",
      },
      {
        scanId: scan2.id,
        severity: "low",
        title: "Unused Import",
        description: "Importing unused crypto module",
        filePath: "src/utils/helpers.ts",
        lineNumber: 3,
        status: "acknowledged",
      },
      {
        scanId: scan1.id,
        severity: "high",
        title: "JWT Secret Hardcoded",
        description: "JWT signing secret is hardcoded in source",
        filePath: "src/auth/jwt.ts",
        lineNumber: 7,
        status: "resolved",
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log(`   Roles: admin, manager, developer`);
  console.log(`   Users: admin@securepulse.dev, developer@securepulse.dev`);
  console.log(`   Repos: 2, Scans: 2, Alerts: 5`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
