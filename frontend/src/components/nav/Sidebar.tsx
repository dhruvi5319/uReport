'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CurrentUser } from '@/types/api';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: CurrentUser;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/map', label: 'Map', icon: '🗺️' },
];

const adminItems = [
  { href: '/admin/departments', label: 'Departments', icon: '🏢' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/people', label: 'People', icon: '👥' },
  { href: '/admin/templates', label: 'Templates', icon: '📝' },
  { href: '/admin/clients', label: 'API Clients', icon: '🔑' },
  { href: '/admin/substatuses', label: 'Substatuses', icon: '🔖' },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === 'admin';

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r bg-white md:flex md:flex-col">
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Sidebar navigation">
        <ul className="space-y-1" role="list">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(item.href) && item.href !== '/dashboard'
                    ? 'bg-primary/10 text-primary'
                    : pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>
            <ul className="space-y-1" role="list">
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname.startsWith(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    )}
                    aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Department badge at bottom */}
      {user.department && (
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground">Department</p>
          <p className="text-sm font-medium truncate">{user.department.name}</p>
        </div>
      )}
    </aside>
  );
}
