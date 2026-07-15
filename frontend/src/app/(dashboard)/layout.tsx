"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Each page renders its own <Header> inside the scroll area */}
          <main className="flex-1 overflow-y-auto">
            {/* Pass the sidebar toggle down via a context alternative: we
                expose it through a custom event so child pages can control
                the mobile hamburger without prop drilling */}
            <div
              id="dashboard-main"
              data-open-sidebar={String(sidebarOpen)}
              onClickCapture={(e) => {
                const el = e.target as HTMLElement;
                if (el.dataset.openmenu === "true") setSidebarOpen(true);
              }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
