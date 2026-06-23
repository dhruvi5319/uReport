'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/departments', label: 'Departments' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/people', label: 'People & Users' },
  { href: '/admin/substatuses', label: 'Substatuses' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/clients', label: 'API Clients' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <ul className="py-2" role="list">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <nav
        className="w-56 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen hidden md:block"
        aria-label="Admin navigation"
      >
        <div className="p-4 border-b border-gray-200">
          <Link href="/admin" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
            Admin
          </Link>
        </div>
        <NavLinks />
      </nav>

      {/* Mobile top bar — visible on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <Link href="/admin" className="text-base font-semibold text-gray-900">
          Admin
        </Link>
        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-lg">
          <nav aria-label="Admin navigation mobile">
            <NavLinks />
          </nav>
        </div>
      )}

      {/* Mobile spacer to push content below fixed header */}
      <div className="md:hidden h-14 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
