import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

// Exact breadcrumb route map from FRD F18
const breadcrumbMap: Record<string, string[]> = {
  "/dashboard":             ["Dashboard"],
  "/cases":                 ["Cases"],
  "/cases/new":             ["Cases", "New Case"],
  "/admin/people":          ["Admin", "People"],
  "/admin/departments":     ["Admin", "Departments"],
  "/admin/categories":      ["Admin", "Categories"],
  "/admin/substatus":       ["Admin", "Substatuses"],
  "/admin/issue-types":     ["Admin", "Issue Types"],
  "/admin/contact-methods": ["Admin", "Contact Methods"],
  "/admin/clients":         ["Admin", "API Clients"],
  "/admin/actions":         ["Admin", "Actions"],
  "/metrics":               ["Reports", "Metrics"],
  "/reports":               ["Reports", "Reports"],
  "/account":               ["Account"],
};

// Dynamic segment href map for breadcrumb parent links
const parentHrefs: Record<string, string> = {
  Admin: "/admin/people",
  Cases: "/cases",
  Reports: "/metrics",
};

function resolveBreadcrumbs(pathname: string): string[] {
  // Exact match first
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];

  // Dynamic segments: /cases/:id → ["Cases", "Case #id"]
  const casesMatch = pathname.match(/^\/cases\/([^/]+)$/);
  if (casesMatch) return ["Cases", `Case #${casesMatch[1]}`];

  // Dynamic segments: /admin/people/:id → ["Admin", "People", "Person"]
  const adminPeopleMatch = pathname.match(/^\/admin\/people\/([^/]+)$/);
  if (adminPeopleMatch) return ["Admin", "People", "Person"];

  // Generic fallback: capitalize last segment
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export default function AppBreadcrumb() {
  const { pathname } = useLocation();
  const crumbs = resolveBreadcrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <BreadcrumbRoot aria-label="Breadcrumb">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const href = parentHrefs[crumb] ?? null;

          return (
            <BreadcrumbItem key={`${crumb}-${index}`}>
              {isLast ? (
                <BreadcrumbPage aria-current="page">{crumb}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    {href ? (
                      <Link to={href}>{crumb}</Link>
                    ) : (
                      <span>{crumb}</span>
                    )}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator aria-hidden="true" />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
