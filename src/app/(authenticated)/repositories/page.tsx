import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, ExternalLink, Container, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { RefreshReposButton } from "@/components/refresh-repos-button";
import { ConnectGitHubButton } from "@/components/connect-github-button";
import { ConnectDockerButton } from "@/components/connect-docker-button";
import { ScanRepoButton } from "@/components/scan-repo-button";
import { ClearAllReposButton } from "@/components/clear-all-repos-button";
import { formatDateShort } from "@/lib/format-date";

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RepositoriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const repos = await prisma.gitHubRepository.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { scans: true } },
      scans: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { status: true, startedAt: true },
      },
    },
  });

  const images = await prisma.dockerImage.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { scans: true } },
      scans: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { status: true, startedAt: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositories</h2>
          <p className="text-muted-foreground">
            Manage your GitHub repositories and Docker images
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshReposButton />
          <ConnectGitHubButton />
          <ConnectDockerButton />
        </div>
      </div>

      {/* GitHub Repos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Repositories ({repos.length})
          </h3>
          <ClearAllReposButton count={repos.length} type="github" />
        </div>
        {repos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No repositories connected. Connect your GitHub account or add a PAT to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <Card key={repo.id} className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium truncate">
                      {repo.fullName}
                    </CardTitle>
                    <a href={repo.repoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={repo.visibility === "private" ? "secondary" : "outline"} className="text-xs">
                      {repo.visibility}
                    </Badge>
                    {repo.language && <span>{repo.language}</span>}
                    {repo.defaultBranch && <span>· {repo.defaultBranch}</span>}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{repo._count.scans} scans</span>
                      {repo.scans[0] && (
                        <div className="flex items-center gap-1">
                          {repo.scans[0].status === "completed" && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                          {repo.scans[0].status === "failed" && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {repo.scans[0].status === "running" && (
                            <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
                          )}
                          {repo.scans[0].status === "pending" && (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <ScanRepoButton repoId={repo.id} repoName={repo.fullName} />
                  </div>
                  {repo.lastScanned && (
                    <p className="text-xs text-muted-foreground mt-1">Last scanned: {formatDateShort(repo.lastScanned)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Docker Images */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Container className="h-5 w-5" />
            Docker Images ({images.length})
          </h3>
          <ClearAllReposButton count={images.length} type="docker" />
        </div>
        {images.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No Docker images connected. Connect your Docker Hub account to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card key={image.id} className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium truncate">
                      {image.imageName}
                    </CardTitle>
                    <a href={image.imageUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {image.namespace}
                    </Badge>
                    <span>{image.repository}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{image._count.scans} scans</span>
                      {image.scans[0] && (
                        <div className="flex items-center gap-1">
                          {image.scans[0].status === "completed" && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                          {image.scans[0].status === "failed" && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {image.scans[0].status === "running" && (
                            <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
                          )}
                          {image.scans[0].status === "pending" && (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <ScanRepoButton repoId={image.id} repoName={image.imageName} />
                  </div>
                  {image.lastScanned && (
                    <p className="text-xs text-muted-foreground mt-1">Last scanned: {formatDateShort(image.lastScanned)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
