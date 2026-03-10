import { stackServerApp } from "@/stack";
import { prisma } from "@/lib/db";

// Sync Stack Auth user to our database and return the DB user with role
export async function getCurrentUser() {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return null;

  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { stackAuthId: stackUser.id },
        { email: stackUser.primaryEmail ?? "" },
      ],
    },
    include: { userRoles: { include: { role: true } } },
  });

  if (!dbUser && stackUser.primaryEmail) {
    // Create user on first login
    let devRole = await prisma.role.findFirst({ where: { name: "developer" } });
    if (!devRole) {
      devRole = await prisma.role.create({
        data: { name: "developer", description: "Developer role" },
      });
    }

    dbUser = await prisma.user.create({
      data: {
        email: stackUser.primaryEmail,
        name: stackUser.displayName ?? stackUser.primaryEmail.split("@")[0],
        stackAuthId: stackUser.id,
        avatarUrl: stackUser.profileImageUrl ?? null,
        userRoles: { create: { roleId: devRole.id } },
      },
      include: { userRoles: { include: { role: true } } },
    });
  } else if (dbUser && !dbUser.stackAuthId) {
    // Link existing user to Stack Auth
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        stackAuthId: stackUser.id,
        avatarUrl: stackUser.profileImageUrl ?? dbUser.avatarUrl,
      },
    });
  }

    if (!dbUser) return null;

    const role = dbUser.userRoles?.[0]?.role?.name || "developer";
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      role,
      stackAuthId: dbUser.stackAuthId,
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    // Return null instead of throwing to allow graceful degradation
    return null;
  }
}

// For API routes: require auth and return user or throw
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Check if user has required role
export function hasRole(userRole: string, requiredRoles: string[]) {
  return requiredRoles.some(
    (r) => r.toLowerCase() === userRole.toLowerCase()
  );
}
