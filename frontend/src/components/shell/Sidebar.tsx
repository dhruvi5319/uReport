import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Users,
  Building2,
  Tag,
  Circle,
  AlertCircle,
  Phone,
  Key,
  Zap,
  BarChart,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

const SIDEBAR_KEY = "sidebar-collapsed";

const navGroups = [
  {
    label: "Cases",
    roles: ["staff", "admin"],
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "All Cases", href: "/cases", icon: FolderOpen },
      { label: "New Case", href: "/cases/new", icon: Plus },
    ],
  },
  {
    label: "Admin",
    roles: ["admin"],
    items: [
      { label: "People", href: "/admin/people", icon: Users },
      { label: "Departments", href: "/admin/departments", icon: Building2 },
      { label: "Categories", href: "/admin/categories", icon: Tag },
      { label: "Substatuses", href: "/admin/substatus", icon: Circle },
      { label: "Issue Types", href: "/admin/issue-types", icon: AlertCircle },
      { label: "Contact Methods", href: "/admin/contact-methods", icon: Phone },
      { label: "API Clients", href: "/admin/clients", icon: Key },
      { label: "Actions", href: "/admin/actions", icon: Zap },
    ],
  },
  {
    label: "Reports",
    roles: ["staff", "admin"],
    items: [
      { label: "Metrics", href: "/metrics", icon: BarChart },
      { label: "Reports", href: "/reports", icon: FileText },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });
  const { user } = useAuth();
  const role = user?.role ?? "staff";

  function toggleCollapse() {
    const next = !collapsed;
    localStorage.setItem(SIDEBAR_KEY, String(next));
    setCollapsed(next);
  }

  const visibleGroups = navGroups.filter((g) => g.roles.includes(role));

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card shrink-0 overflow-x-hidden",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end p-2 border-b border-border">
        <button
          type="button"
          onClick={toggleCollapse}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar-nav-content"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Nav groups */}
      <div id="sidebar-nav-content" className="flex-1 overflow-y-auto py-2">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul role="list">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      end={item.href === "/dashboard" || item.href === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md mx-2 px-2 py-1.5 text-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          collapsed && "justify-center"
                        )
                      }
                      aria-label={collapsed ? item.label : undefined}
                    >
                      {({ isActive: _isActive }) => (
                        <>
                          <Icon
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {!collapsed && (
                            <span>{item.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
