import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomTabBar } from "./BottomTabBar";
import { LmsSubNav } from "./LmsSubNav";

/**
 * The public learning pages used to carry their own header, logo and account
 * menu, so entering the section felt like leaving the site. They now sit in the
 * site layout with a section sub-nav underneath the main header.
 */
export function LmsLayout() {
  return (
    <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <ScrollRestoration />
      <Header />
      <LmsSubNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  );
}
