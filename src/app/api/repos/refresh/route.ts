import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function fetchAllGitHubPages(url: string, token: string, params: Record<string, string> = {}) {
  const allItems: any[] = [];
  let page = 1;
  while (true) {
    const u = new URL(url);
    u.searchParams.set("per_page", "100");
    u.searchParams.set("page", String(page));
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);

    const res = await fetch(u.toString(), {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) break;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) break;
    allItems.push(...items);
    if (items.length < 100) break;
    page++;
  }
  return allItems;
}

export async function POST() {
  try {
    const user = await requireAuth();

    const tokens = await prisma.oAuthToken.findMany({
      where: { userId: user.id, provider: "github" },
    });

    const accessTokens: { label: string; token: string }[] = tokens.map((t) => ({
      label: t.label,
      token: t.accessToken,
    }));
    if (accessTokens.length === 0 && process.env.GITHUB_TOKEN) {
      accessTokens.push({ label: "env", token: process.env.GITHUB_TOKEN });
    }
    if (accessTokens.length === 0) {
      return NextResponse.json({ error: "No GitHub token. Connect via PAT first." }, { status: 400 });
    }

    let totalCount = 0;
    for (const { token } of accessTokens) {
      const repos = await fetchAllGitHubPages("https://api.github.com/user/repos", token, {
        affiliation: "owner,collaborator,organization_member",
      });

      for (const repo of repos) {
        await prisma.gitHubRepository.upsert({
          where: { userId_fullName: { userId: user.id, fullName: repo.full_name } },
          update: {
            repoName: repo.name,
            repoUrl: repo.html_url,
            visibility: repo.private ? "private" : "public",
            defaultBranch: repo.default_branch,
            language: repo.language,
            description: repo.description,
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            repoName: repo.name,
            repoUrl: repo.html_url,
            fullName: repo.full_name,
            visibility: repo.private ? "private" : "public",
            defaultBranch: repo.default_branch,
            language: repo.language,
            description: repo.description,
          },
        });
      }
      totalCount += repos.length;
    }

    return NextResponse.json({ message: "Repositories refreshed", count: totalCount });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to refresh" }, { status: 500 });
  }
}
