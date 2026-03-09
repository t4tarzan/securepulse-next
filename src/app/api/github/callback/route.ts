import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://securepulse-next.vercel.app";

  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${appUrl}/repositories?error=github_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${appUrl}/repositories?error=missing_params`);
    }

    // Verify state
    const storedState = req.cookies.get("github_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${appUrl}/repositories?error=invalid_state`);
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/repositories?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user info
    const ghUserRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });
    const ghUser = await ghUserRes.json();

    // Store the token
    await prisma.oAuthToken.upsert({
      where: {
        userId_provider_label: { userId: user.id, provider: "github", label: ghUser.login || "default" },
      },
      update: { accessToken, updatedAt: new Date() },
      create: {
        userId: user.id,
        provider: "github",
        label: ghUser.login || "default",
        accessToken,
      },
    });

    // Auto-refresh repos with the new token
    await refreshRepos(user.id, accessToken);

    // Clear state cookie and redirect
    const response = NextResponse.redirect(`${appUrl}/repositories?connected=true`);
    response.cookies.delete("github_oauth_state");
    return response;
  } catch (error: any) {
    console.error("GitHub callback error:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.redirect(`${appUrl}/signin`);
    }
    return NextResponse.redirect(`${appUrl}/repositories?error=callback_failed`);
  }
}

async function refreshRepos(userId: string, token: string) {
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
      {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
      }
    );
    if (!res.ok) break;
    const repos = await res.json();
    if (!Array.isArray(repos) || repos.length === 0) break;

    for (const repo of repos) {
      await prisma.gitHubRepository.upsert({
        where: { userId_fullName: { userId, fullName: repo.full_name } },
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
          userId,
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

    if (repos.length < 100) break;
    page++;
  }
}
