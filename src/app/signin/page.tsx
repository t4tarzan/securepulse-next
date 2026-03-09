import { Suspense } from "react";
import { SignInContent } from "@/components/signin-content";

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
