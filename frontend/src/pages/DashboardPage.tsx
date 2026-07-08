import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

// UAT showcase — demonstrates Phase 7 design system components.
// Replaced by real dashboard content in Phase 8.
export default function DashboardPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Phase 7 Design System Showcase</h1>
        <p className="mt-1 text-muted-foreground">Real dashboard content coming in Phase 8.</p>
      </div>

      {/* Badge status variants */}
      <Card>
        <CardHeader><CardTitle>Badge Status Variants</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="open">Open</Badge>
          <Badge variant="resolved">Resolved</Badge>
          <Badge variant="duplicate">Duplicate</Badge>
          <Badge variant="bogus">Bogus</Badge>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </CardContent>
      </Card>

      {/* Button variants */}
      <Card>
        <CardHeader><CardTitle>Button Variants &amp; Focus Ring</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
        </CardContent>
      </Card>

      {/* Input dark mode */}
      <Card>
        <CardHeader><CardTitle>Input (Dark Mode Support)</CardTitle></CardHeader>
        <CardContent className="max-w-sm space-y-3">
          <Input placeholder="Type something..." />
          <Input placeholder="Disabled input" disabled />
        </CardContent>
      </Card>
    </motion.div>
  );
}
