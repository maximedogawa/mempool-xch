import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-5">
        {children}
      </main>
      <Footer />
    </div>
  );
}
