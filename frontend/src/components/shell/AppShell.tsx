import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="flex h-screen bg-background">
      <main id="main-content" className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
