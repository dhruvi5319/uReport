import { useState, useEffect, useCallback } from "react";
import { Menu, Sun, Moon, Monitor, LogOut, User, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import MobileDrawer from "./MobileDrawer";
import type { TicketSummary } from "@/types/ticket";

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInputValue, setCommandInputValue] = useState("");
  const [commandQuery, setCommandQuery] = useState("");
  const [commandResults, setCommandResults] = useState<TicketSummary[]>([]);
  const [commandLoading, setCommandLoading] = useState(false);

  const ThemeIcon = themeIcons[theme] ?? Monitor;

  function cycleTheme() {
    const order = ["light", "dark", "system"] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  const initials = user
    ? `${user.firstname[0] ?? ""}${user.lastname[0] ?? ""}`.toUpperCase()
    : "?";

  // Keyboard shortcut: Cmd+K / Ctrl+K opens Command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search: update commandQuery 300ms after input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCommandQuery(commandInputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [commandInputValue]);

  // Fetch search results when commandQuery >= 2 chars
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCommandResults([]);
      setCommandLoading(false);
      return;
    }
    setCommandLoading(true);
    try {
      const res = await fetch(
        `/api/tickets?q=${encodeURIComponent(q)}&pageSize=5`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // API returns PaginatedTickets { items: TicketSummary[] } or TicketSummary[]
      const items: TicketSummary[] = Array.isArray(data) ? data : data.items ?? [];
      setCommandResults(items);
    } catch {
      setCommandResults([]);
    } finally {
      setCommandLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(commandQuery);
  }, [commandQuery, fetchResults]);

  // Reset state when dialog closes
  function handleOpenChange(open: boolean) {
    setCommandOpen(open);
    if (!open) {
      setCommandInputValue("");
      setCommandQuery("");
      setCommandResults([]);
      setCommandLoading(false);
    }
  }

  function handleSelectResult(ticket: TicketSummary) {
    navigate(`/cases/${ticket.id}`);
    handleOpenChange(false);
  }

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

      {/* Command palette trigger button */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="hidden sm:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground border border-input bg-background hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open command palette (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Search cases...</span>
        <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

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

      {/* Command palette dialog */}
      <CommandDialog open={commandOpen} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search cases..."
          value={commandInputValue}
          onValueChange={setCommandInputValue}
        />
        <CommandList>
          {commandLoading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : commandQuery.length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search cases</CommandEmpty>
          ) : commandResults.length === 0 ? (
            <CommandEmpty>No cases found for '{commandQuery}'</CommandEmpty>
          ) : (
            <CommandGroup heading="Cases">
              {commandResults.map(ticket => (
                <CommandItem
                  key={ticket.id}
                  value={`${ticket.ticketId} ${ticket.categoryName}`}
                  onSelect={() => handleSelectResult(ticket)}
                  className="flex items-center gap-2"
                >
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {ticket.ticketId}
                  </span>
                  <span className="flex-1 truncate">{ticket.categoryName}</span>
                  <Badge
                    variant={ticket.status === 'open' ? 'default' : 'secondary'}
                    className="shrink-0 text-xs"
                  >
                    {ticket.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
