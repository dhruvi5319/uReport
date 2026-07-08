import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

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

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { user } = useAuth();
  const role = user?.role ?? "staff";
  const visibleGroups = navGroups.filter((g) => g.roles.includes(role));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="mobile-drawer"
        side="left"
        className="w-72 p-0"
        aria-label="Mobile navigation"
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold">uReport CRM</SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile primary navigation" className="py-2">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul role="list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        end={item.href === "/dashboard" || item.href === "/"}
                        onClick={() => onOpenChange(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-md mx-2 px-2 py-1.5 text-sm transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
