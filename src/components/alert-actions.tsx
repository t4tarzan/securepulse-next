"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function AcknowledgeButton({ alertId }: { alertId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAcknowledge() {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, { method: "POST" });
      if (res.ok) router.refresh();
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleAcknowledge} disabled={loading} className="h-7 text-xs">
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
      Acknowledge
    </Button>
  );
}

export function ResolveButton({ alertId }: { alertId: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleResolve() {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || "Resolved" }),
      });
      if (res.ok) {
        setOpen(false);
        setNotes("");
        router.refresh();
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-7 text-xs">
          <CheckCheck className="h-3 w-3 mr-1" />
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Alert</DialogTitle>
          <DialogDescription>
            Provide resolution notes explaining how this was fixed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="notes">Resolution Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g. Rotated the exposed API key and added it to .env"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button className="w-full" onClick={handleResolve} disabled={loading}>
            {loading ? "Resolving..." : "Mark as Resolved"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
