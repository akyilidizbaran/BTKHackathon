import { DemoRehearsalWorkspace } from "@/components/commerce/demo-rehearsal-workspace";
import { getDemoRehearsalData } from "@/lib/demo/rehearsal";

export default function DemoPage() {
  return <DemoRehearsalWorkspace data={getDemoRehearsalData()} />;
}
