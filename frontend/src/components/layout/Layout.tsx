import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./Layout.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  // Hide sidebar for admin users (they only see admin dashboard)
  const showSidebar = user?.role !== "admin";

  return (
    <div className="layout">
      {showSidebar && <Sidebar />}

      <div className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
        <Header />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
