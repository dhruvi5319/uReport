'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type CurrentUser } from '@/types/api';

interface TopNavProps {
  user: CurrentUser;
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login?signed_out=1');
    router.refresh();
  }

  const isAdmin = user.role === 'admin';

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-white px-4 shadow-sm">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
        <span className="text-lg">uReport</span>
      </Link>

      {/* Primary nav links */}
      <nav className="ml-8 hidden items-center gap-1 md:flex" aria-label="Primary navigation">
        <Link
          href="/tickets"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Tickets
        </Link>
        <Link
          href="/reports"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Reports
        </Link>
        <Link
          href="/map"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Map
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New Ticket shortcut */}
      <Link
        href="/tickets/new"
        className="mr-4 hidden rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:inline-flex"
      >
        + New Ticket
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-muted"
          aria-label="User menu"
          onClick={() => {
            // Simple toggle — shadcn DropdownMenu added in Wave 3b
            const menu = document.getElementById('user-menu-dropdown');
            menu?.classList.toggle('hidden');
          }}
        >
          <span className="hidden sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        <div
          id="user-menu-dropdown"
          className="hidden absolute right-0 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg"
        >
          <div className="border-b px-4 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">
              {user.primaryEmail ?? `${user.firstName} ${user.lastName}`}
            </p>
            <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
