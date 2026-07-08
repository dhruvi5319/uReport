import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { expect, describe, test, vi, beforeAll } from "vitest";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
  AvatarFallback,
} from "../index";

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

// Mock ResizeObserver (not available in jsdom)
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // Mock matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// ── Button ───────────────────────────────────────────────────────────────────

describe("Button", () => {
  test("renders with default variant classes", () => {
    const { container } = render(<Button>Click me</Button>);
    const btn = container.querySelector("button");
    expect(btn).toBeInTheDocument();
    expect(btn?.className).toMatch(/bg-primary/);
  });

  test("renders destructive variant", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.querySelector("button")?.className).toMatch(/bg-destructive/);
  });

  test("renders outline variant", () => {
    const { container } = render(<Button variant="outline">Cancel</Button>);
    expect(container.querySelector("button")?.className).toMatch(/border/);
  });

  test("has focus-visible ring classes", () => {
    const { container } = render(<Button>Focus me</Button>);
    const className = container.querySelector("button")?.className ?? "";
    expect(className).toMatch(/focus-visible:ring-2/);
  });

  test("is disabled when disabled prop set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Badge ────────────────────────────────────────────────────────────────────

describe("Badge", () => {
  test("renders with default variant", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  test("renders 'open' status variant with blue background", () => {
    const { container } = render(<Badge variant="open">Open</Badge>);
    expect(container.firstChild?.toString()).toBeTruthy();
    // Class should contain status-open (maps to --color-status-open)
    const className = (container.firstChild as HTMLElement)?.className ?? "";
    expect(className).toMatch(/status-open/);
  });

  test("renders 'resolved' status variant", () => {
    const { container } = render(<Badge variant="resolved">Resolved</Badge>);
    const className = (container.firstChild as HTMLElement)?.className ?? "";
    expect(className).toMatch(/status-resolved/);
  });

  test("renders 'duplicate' status variant", () => {
    const { container } = render(<Badge variant="duplicate">Duplicate</Badge>);
    const className = (container.firstChild as HTMLElement)?.className ?? "";
    expect(className).toMatch(/status-duplicate/);
  });

  test("renders 'bogus' status variant", () => {
    const { container } = render(<Badge variant="bogus">Bogus</Badge>);
    const className = (container.firstChild as HTMLElement)?.className ?? "";
    expect(className).toMatch(/status-bogus/);
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(
      <div>
        <Badge>Default</Badge>
        <Badge variant="open">Open</Badge>
        <Badge variant="resolved">Resolved</Badge>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Card ─────────────────────────────────────────────────────────────────────

describe("Card", () => {
  test("renders card with header and content", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>
    );
    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
    // Satisfy unused variable linter
    expect(container).toBeTruthy();
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(
      <Card>
        <CardHeader><CardTitle>Accessible Card</CardTitle></CardHeader>
        <CardContent>Card content</CardContent>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Input ────────────────────────────────────────────────────────────────────

describe("Input", () => {
  test("renders with correct type", () => {
    render(<Input type="email" placeholder="Email" aria-label="Email" />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  test("has focus ring classes", () => {
    const { container } = render(<Input aria-label="Test input" />);
    const input = container.querySelector("input");
    expect(input?.className).toMatch(/focus-visible:ring-2/);
  });

  test("has dark mode background class", () => {
    const { container } = render(<Input aria-label="Dark input" />);
    const input = container.querySelector("input");
    expect(input?.className).toMatch(/bg-background/);
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-input">Email</label>
        <Input id="test-input" type="email" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Table ────────────────────────────────────────────────────────────────────

describe("Table", () => {
  test("renders table with header and body", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell>Open</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>CRM-001</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Skeleton ──────────────────────────────────────────────────────────────────

describe("Skeleton", () => {
  test("renders skeleton element", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild).toBeInTheDocument();
    expect((container.firstChild as HTMLElement)?.className).toMatch(/animate-pulse/);
  });
});

// ── Avatar ───────────────────────────────────────────────────────────────────

describe("Avatar", () => {
  test("renders avatar with fallback", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(
      <Avatar aria-label="John Doe avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Tabs ─────────────────────────────────────────────────────────────────────

describe("Tabs", () => {
  test("renders tabs and shows first tab active by default", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    // Tab 1 is active by default — Content 1 visible
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    // Tab 1 trigger is selected
    expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute("aria-selected", "true");
    // Tab 2 trigger exists and is not selected
    expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveAttribute("aria-selected", "false");
  });

  test("passes axe accessibility scan", async () => {
    const { container } = render(
      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="cases">Cases content</TabsContent>
        <TabsContent value="admin">Admin content</TabsContent>
      </Tabs>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Dialog ───────────────────────────────────────────────────────────────────

describe("Dialog", () => {
  test("opens dialog on trigger click and closes on cancel", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog description for accessibility</DialogDescription>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );
    const trigger = screen.getByText("Open Dialog");
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    });
  });

  test("passes axe accessibility scan when open", async () => {
    const { container } = render(
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
          <DialogDescription>This dialog is accessible</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── Sheet ─────────────────────────────────────────────────────────────────────

describe("Sheet", () => {
  test("renders sheet trigger", () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
          <p>Sheet content</p>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText("Open Sheet")).toBeInTheDocument();
  });
});

// ── All components batch axe scan ─────────────────────────────────────────────

describe("All core components — batch axe scan", () => {
  test("12 core components render with 0 critical axe violations", async () => {
    const { container } = render(
      <div>
        <Button>Submit</Button>
        <Button variant="outline">Cancel</Button>
        <Badge>New</Badge>
        <Badge variant="open">Open</Badge>
        <Card>
          <CardHeader><CardTitle>Case #001</CardTitle></CardHeader>
          <CardContent>Description of the case</CardContent>
        </Card>
        <div>
          <label htmlFor="batch-input">Search</label>
          <Input id="batch-input" placeholder="Search cases..." />
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead scope="col">ID</TableHead><TableHead scope="col">Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>001</TableCell><TableCell>Open</TableCell></TableRow>
          </TableBody>
        </Table>
        <Skeleton className="h-4 w-48" />
        <Tabs defaultValue="a">
          <TabsList><TabsTrigger value="a">Tab A</TabsTrigger></TabsList>
          <TabsContent value="a">Tab A content</TabsContent>
        </Tabs>
        <Avatar aria-label="User JD">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    );
    const results = await axe(container, {
      rules: {
        // Only fail on critical and serious violations
        "color-contrast": { enabled: false }, // CSS vars not resolved in jsdom
      },
    });
    // Filter to only critical/serious violations
    const critical = (results.violations ?? []).filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toHaveLength(0);
  });
});
