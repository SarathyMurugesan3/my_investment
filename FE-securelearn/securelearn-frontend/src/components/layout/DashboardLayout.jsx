import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

/**
 * Global Dashboard Layout
 * Wraps the routed content area next to the role-based Sidebar.
 */
const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen text-slate-200" style={{ background: "linear-gradient(135deg, #020c10 0%, #041f1a 45%, #061510 100%)" }}>
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto animate-fade-in relative z-10 w-full max-h-screen relative">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
