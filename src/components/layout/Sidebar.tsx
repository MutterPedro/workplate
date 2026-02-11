import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { useAppStore } from "../../store/app-store";

const navItems = [
  { to: "/", label: "My Plate", icon: "◉" },
  { to: "/backlog", label: "Backlog", icon: "☰" },
  { to: "/my-day", label: "My Day", icon: "◎" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={clsx(
        "bg-slate-900 text-white flex flex-col transition-all duration-200",
        sidebarCollapsed ? "w-14" : "w-52",
      )}
      data-testid="sidebar"
    >
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        {!sidebarCollapsed && <span className="font-bold text-lg">WorkPlate</span>}
        <button
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white p-1"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <span>{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
