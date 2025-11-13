import * as React from "react";
import { GlobalNavigation } from "./GlobalNavigation";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background">
      <GlobalNavigation />
      <main>{children}</main>
      <footer>
        <div className="container mx-auto px-4 py-4 border-t border-border">
          <p className="text-sm text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Library. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
