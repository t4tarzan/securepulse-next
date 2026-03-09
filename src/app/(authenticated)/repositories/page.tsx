import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshReposButton } from "@/components/refresh-repos-button";
import { ConnectGitHubButton } from "@/components/connect-github-button";
import { ScanRepoButton } from "@/components/scan-repo-button";

export default async function RepositoriesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const repos = await prisma.gitHubRepository.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { scans: true } },
    },
  });

  const images = await prisma.dockerImage.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { scans: true } },
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
        </div>
      </div>

      {/* GitHub Repos */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Repositories ({repos.length})
        </h3>
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
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{repo._count.scans} scans</span>
                    <ScanRepoButton repoId={repo.id} repoName={repo.fullName} />
                  </div>
                  {repo.lastScanned && (
                    <p className="text-xs text-muted-foreground mt-1">Last scanned: {repo.lastScanned.toLocaleDateString()}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Docker Images */}
      {images.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Docker Images ({images.length})
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card key={image.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {image.imageName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    {image.namespace}/{image.repository}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{image._count.scans} scans</span>
                    {image.lastScanned && (
                      <span>Last: {image.lastScanned.toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
