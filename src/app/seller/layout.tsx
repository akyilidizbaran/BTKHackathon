import { WorkspaceShell } from "@/components/commerce/workspace-shell";

export default function SellerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WorkspaceShell role="seller">{children}</WorkspaceShell>;
}
