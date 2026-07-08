import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center"
    >
      <div className="rounded-full bg-secondary p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Coming Soon</h1>
      <p className="text-muted-foreground max-w-sm">
        This page is under construction and will be available in an upcoming phase.
      </p>
      <Button variant="outline" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </motion.div>
  );
}
