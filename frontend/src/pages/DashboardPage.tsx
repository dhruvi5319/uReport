import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";

export default function DashboardPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Dashboard coming in Phase 8</p>
    </motion.div>
  );
}
