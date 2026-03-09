"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function ConnectGitHubButton() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const hasGitHubOAuth = !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

  function handleOAuthConnect() {
    window.location.href = "/api/github/authorize";
  }

  async function handlePATConnect() {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/repos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), label: label.trim() || "default" }),
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-refresh repos after connecting
        await fetch("/api/repos/refresh", { method: "POST" });
        setOpen(false);
        setToken("");
        router.refresh();
      } else {
        setError(data.error || "Failed to connect");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Connect GitHub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect GitHub Account</DialogTitle>
          <DialogDescription>
            Connect your GitHub account to discover and scan your repositories.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* OAuth connect - one click */}
          {hasGitHubOAuth && (
            <>
              <Button className="w-full" size="lg" onClick={handleOAuthConnect}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Connect with GitHub OAuth
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or use a token</span>
                </div>
              </div>
            </>
          )}

          {/* PAT connect */}
          <div className="space-y-2">
            <Label htmlFor="token">
              <Key className="h-3.5 w-3.5 inline mr-1" />
              GitHub Personal Access Token
            </Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generate at{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=SecurePulse"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                github.com/settings/tokens
              </a>
              {" "}with <code className="text-xs">repo</code> scope.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              placeholder="e.g. personal, work"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" variant="secondary" onClick={handlePATConnect} disabled={loading || !token.trim()}>
            {loading ? "Connecting..." : "Connect with Token"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
