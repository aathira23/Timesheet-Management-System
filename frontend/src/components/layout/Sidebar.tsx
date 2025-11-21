import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Clock } from "lucide-react";
import "./Sidebar.css";

interface MenuItem {
  label: string;
  path?: string;
  icon?: string;
}

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getMenuItems = (): MenuItem[] => {
    if (user?.role === "admin") {
      return [
        { label: "Dashboard", path: "/dashboard" },
      ];
    }

    if (user?.role === "manager") {
      return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Projects", path: "/projects" },
        { label: "Approvals", path: "/approvals" },
      ];
    }

    return [
      { label: "Dashboard", path: "/dashboard"},
      { label: "Timesheet", path: "/timesheet" },
      { label: "Calendar", path: "/calendar"},
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="sidebar">
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-icon">
          <Clock size={24} color="white" />
        </div>
        <h2 className="sidebar-logo">TimeTracker</h2>
      </div>

      <ul className="menu">
        {menuItems.map((item) => (
          <li key={item.label}>
            <div
              className={
                location.pathname === item.path ? "active menu-item" : "menu-item"
              }
            >
              <Link to={item.path!}>
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
