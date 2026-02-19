import { cookies } from "next/headers";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { PlaidCredentialsProvider } from "@/lib/plaid/credentials-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PlaidCredentialsProvider>
      <DataStreamProvider>
        <Suspense fallback={<div className="flex h-dvh" />}>
          <SidebarWrapper>{children}</SidebarWrapper>
        </Suspense>
      </DataStreamProvider>
    </PlaidCredentialsProvider>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
