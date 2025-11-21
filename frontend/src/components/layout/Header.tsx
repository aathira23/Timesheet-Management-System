import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import "./Header.css";

const Header = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfileMenu]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setShowProfileMenu(false);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-title">
        <h3>Timesheet Management</h3>
      </div>

      <div className="header-actions">

        {/* Visible logout button */}
        <button
          className="header-icon-btn logout-icon"
          title="Logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
        </button>

        {/* Profile Dropdown */}
        <div className="profile-dropdown" ref={profileMenuRef}>
          <button
            className="header-icon-btn profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <User size={20} />
          </button>

          {showProfileMenu && (
            <div className="profile-menu">
              <div className="profile-header">
                <div className="profile-avatar">{user?.name.charAt(0)}</div>
                <div>
                  <p className="profile-name">{user?.name}</p>
                  <p className="profile-email">{user?.email}</p>
                  <p className="profile-role">{user?.role}</p>
                </div>
              </div>
              <div className="profile-menu-divider"></div>
              <button className="profile-menu-item logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Logout</h3>
                <button className="modal-close" onClick={() => setShowLogoutConfirm(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="alert-box">
                  <LogOut size={20} />
                  <div>
                    <p>Are you sure you want to logout?</p>
                  </div>
                </div>
                <div className="confirm-actions">
                  <button className="delete-confirm-btn" onClick={confirmLogout}>Yes, Logout</button>
                  <button className="cancel-confirm-btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
