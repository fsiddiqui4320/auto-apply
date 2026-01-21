import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, FileText, Settings, PlusCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: PlusCircle, label: "New Jobs", path: "/jobs" },
    { icon: FileText, label: "Master Resume", path: "/resume" },
    { icon: Briefcase, label: "Ready to Apply", path: "/ready" },
    { icon: History, label: "Applied", path: "/applied" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Briefcase className="w-6 h-6" />
            <span>AutoApply</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary-foreground" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Status</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              System Ready
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
