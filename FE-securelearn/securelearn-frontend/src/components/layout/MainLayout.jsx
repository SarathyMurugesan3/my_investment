import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen text-slate-200">
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto animate-fade-in relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;