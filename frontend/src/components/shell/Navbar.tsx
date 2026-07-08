import { Menu, Sun, Moon, Monitor, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import MobileDrawer from "./MobileDrawer";

import { useState } from "react";

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ThemeIcon = themeIcons[theme] ?? Monitor;

  function cycleTheme() {
    const order = ["light", "dark", "system"] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  const initials = user
    ? `${user.firstname[0] ?? ""}${user.lastname[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 gap-3">
      {/* Mobile hamburger — visible below md breakpoint */}
      <button
        type="button"
        className="md:hidden rounded-md p-1.5 text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-drawer"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* City logo + app name */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
        aria-label="uReport CRM — go to dashboard"
      >
        {/* City shield icon (inline SVG — no external request) */}
        <svg
          aria-hidden="true"
          className="h-7 w-7 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
        </svg>
        <span className="text-sm font-semibold">uReport CRM</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        type="button"
        onClick={cycleTheme}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} mode (currently ${theme})`}
      >
        <ThemeIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* User avatar with popover dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
            aria-label={`User menu for ${user?.firstname ?? "Unknown"} ${user?.lastname ?? ""}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="end">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {user?.username ?? "Unknown user"}
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/account"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            My Account
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </PopoverContent>
      </Popover>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
