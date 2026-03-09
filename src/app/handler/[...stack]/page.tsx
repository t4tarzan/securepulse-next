import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default function StackHandlerPage(props: { params: Promise<{ stack: string[] }> }) {
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
