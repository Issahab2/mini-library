import * as React from "react";
import { GlobalNavigation } from "./GlobalNavigation";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavigation />
      <main>{children}</main>
    </div>
  );
}
