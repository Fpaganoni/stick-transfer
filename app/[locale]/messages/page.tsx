"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MessagesPage } from "@/components/pages/messages-page";

export default function MessagesRoute() {
  return (
    <AppShell title="Messages">
      <Suspense fallback={null}>
        <MessagesPage />
      </Suspense>
    </AppShell>
  );
}
