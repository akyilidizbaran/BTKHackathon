import { WorkspaceShell } from "@/components/commerce/workspace-shell";

export default function BuyerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WorkspaceShell role="buyer">{children}</WorkspaceShell>;
}
