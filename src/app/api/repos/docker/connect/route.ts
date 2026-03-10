import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch repositories from Docker Hub API
    const reposResponse = await fetch(
      `https://hub.docker.com/v2/repositories/${username}/?page_size=100`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!reposResponse.ok) {
      if (reposResponse.status === 404) {
        return NextResponse.json({ error: "Docker Hub user not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch Docker Hub repositories" }, { status: 500 });
    }

    const data = await reposResponse.json();
    const repositories = data.results || [];

    if (repositories.length === 0) {
      return NextResponse.json({ 
        message: "No public repositories found for this user",
        count: 0 
      });
    }

    // Store images in database
    const images = [];
    for (const repo of repositories) {
      const imageName = `${username}/${repo.name}`;
      
      // Upsert the image
      const image = await prisma.dockerImage.upsert({
        where: {
          userId_namespace_repository: {
            userId: user.id,
            namespace: username,
            repository: repo.name,
          },
        },
        update: {
          imageName,
          imageUrl: `https://hub.docker.com/r/${imageName}`,
        },
        create: {
          userId: user.id,
          imageName,
          imageUrl: `https://hub.docker.com/r/${imageName}`,
          namespace: username,
          repository: repo.name,
        },
      });

      images.push(image);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DOCKER_CONNECTED",
        resourceType: "DockerImage",
        resourceId: username,
        metadata: { count: images.length },
      },
    });

    return NextResponse.json({
      message: "Docker Hub connected successfully",
      count: images.length,
      images: images.map(img => ({
        id: img.id,
        name: img.imageName,
      })),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Docker connect error:", error);
    return NextResponse.json({ error: "Failed to connect Docker Hub" }, { status: 500 });
  }
}
