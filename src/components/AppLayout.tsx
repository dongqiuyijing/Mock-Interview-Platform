import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, PlusCircle, History, Radar, CalendarCheck, LogOut,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Stepper, StepId } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.dashboard", icon: LayoutDashboard, exact: true },
  { to: "/new", key: "nav.new", icon: PlusCircle },
  { to: "/history", key: "nav.history", icon: History },
  { to: "/skills", key: "nav.skills", icon: Radar },
  { to: "/plan", key: "nav.plan", icon: CalendarCheck },
];

interface AppLayoutProps {
  children: ReactNode;
  /** Optional flow stepper shown above the content (workbench pages). */
  step?: StepId;
  /** Highlight a nav item even if the route isn't an exact match. */
  activePath?: string;
  /** Use a wider content container (e.g. report pages with side-by-side grids). */
  wide?: boolean;
}

export const AppLayout = ({ children, step, activePath, wide }: AppLayoutProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const current = activePath ?? location.pathname;

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? current === item.to : current.startsWith(item.to);

  return (
    <div className="flex min-h-screen overflow-x-clip bg-secondary/40">
      {/* Sidebar */}
      <aside className="sticky top-0 z-40 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="display text-lg">{t("app.name")}</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                isActive(item)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}>
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          {user && (
            <div className="mb-3 truncate text-xs text-muted-foreground" title={user.email ?? ""}>
              {user.email}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={signOut}
            className="w-full justify-start rounded-xl text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />{t("nav.signOut")}
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur sm:px-8">
          {/* Mobile brand + nav */}
          <div className="flex items-center gap-4 md:hidden">
            <span className="display text-base">{t("app.name")}</span>
          </div>
          <div className="hidden md:block">
            {step ? <Stepper current={step} /> : <span className="label-eyebrow">{t("app.tagline")}</span>}
          </div>
          <div className="flex items-center">
            <LanguageSwitcher className="h-9 w-[120px] rounded-full border-border text-xs" />
            <Button variant="ghost" size="icon" onClick={signOut}
              className="ml-2 h-9 w-9 rounded-full text-muted-foreground md:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile nav row */}
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-smooth",
                isActive(item) ? "bg-foreground text-background" : "text-muted-foreground",
              )}>
              <item.icon className="h-3.5 w-3.5" />
              {t(item.key)}
            </Link>
          ))}
        </div>

        <main className={cn("mx-auto px-5 py-8 sm:px-8 sm:py-10", wide ? "max-w-[1400px]" : "max-w-6xl")}>
          {step && (
            <div className="mb-8 md:hidden">
              <Stepper current={step} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
