import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Users, Building2, PlusCircle, AlertCircle, Eye, Edit2, Trash2 } from "lucide-react";
import type { UserDTO, DepartmentDTO, RoleDTO } from "../services/adminService";
import {
  getAllUsers,
  getAllDepartments,
  getAllRoles,
  createUser,
  updateUser,
  deleteUser,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/adminService";
import "./AdminDashboard.css";

// Utility functions
const formatRoleName = (roleName?: string): string => {
  if (!roleName) return "Unknown";
  const roleMap: Record<string, string> = {
    "ROLE_ADMIN": "Admin",
    "ROLE_MANAGER": "Manager",
    "ROLE_EMPLOYEE": "Employee",
  };
  return roleMap[roleName] || roleName;
};

const getRoleColor = (roleName?: string): string => {
  if (!roleName) return "role-unknown";
  const colorMap: Record<string, string> = {
    "ROLE_ADMIN": "role-admin",
    "ROLE_MANAGER": "role-manager",
    "ROLE_EMPLOYEE": "role-employee",
  };
  return colorMap[roleName] || "role-unknown";
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showDepartmentsList, setShowDepartmentsList] = useState(false);

  // Refs for scrolling
  const usersListRef = useRef<HTMLDivElement>(null);
  const deptsListRef = useRef<HTMLDivElement>(null);

  // Form state
  const [showUserForm, setShowUserForm] = useState<{ visible: boolean; data?: Partial<UserDTO> }>({ visible: false });
  const [showDeptForm, setShowDeptForm] = useState<{ visible: boolean; data?: Partial<DepartmentDTO> }>({ visible: false });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [deptFormErrors, setDeptFormErrors] = useState<Record<string, string>>({});

  // View modals
  const [viewUserModal, setViewUserModal] = useState<{ visible: boolean; data?: UserDTO }>({ visible: false });
  const [viewDeptModal, setViewDeptModal] = useState<{ visible: boolean; data?: DepartmentDTO }>({ visible: false });

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; type: "user" | "dept"; id?: number; name?: string }>({ visible: false, type: "user" });

  // Fetch functions
  const fetchRoles = async () => {
    try {
      const data = await getAllRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRoles();
      fetchUsers();
      fetchDepartments();
    }
  }, [user]);

  // Validation functions
  const validateUserForm = (data: any): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.email?.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email format";

    // Password is always required, even when editing
    if (!data.password?.trim()) errors.password = "Password is required";
    else if (data.password.length < 6) errors.password = "Password must be at least 6 characters";

    if (data.phoneNumber && !/^\d{10}$/.test(data.phoneNumber.replace(/\D/g, ""))) {
      errors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if (!data.roleId) errors.roleId = "Role is required";

    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDeptForm = (data: any): boolean => {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) errors.name = "Department name is required";

    setDeptFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save functions
  const handleSaveUser = async (formData: any) => {
    if (!validateUserForm(formData)) return;

    try {
      const userData: Partial<UserDTO> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        active: formData.active !== false,
        roleId: parseInt(formData.roleId),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      };

      if (formData.id) {
        // Always require password for update
        const updated = await updateUser(formData.id, userData);
        setUsers(prev => prev.map(u => (u.id === formData.id ? updated : u)));
      } else {
        const created = await createUser(userData);
        setUsers(prev => [...prev, created]);
      }
      setShowUserForm({ visible: false });
      setUserFormErrors({});
    } catch (err: any) {
      console.error("Error saving user:", err);
      setUserFormErrors({ submit: err.response?.data?.message || "Failed to save user" });
    }
  };

  const handleSaveDept = async (formData: any) => {
    if (!validateDeptForm(formData)) return;

    try {
      const deptData: Partial<DepartmentDTO> = {
        name: formData.name,
        description: formData.description || undefined,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
      };

      if (formData.id) {
        const updated = await updateDepartment(formData.id, deptData);
        setDepartments(prev => prev.map(d => (d.id === formData.id ? updated : d)));
      } else {
        const created = await createDepartment(deptData);
        setDepartments(prev => [...prev, created]);
      }
      setShowDeptForm({ visible: false });
      setDeptFormErrors({});
    } catch (err: any) {
      console.error("Error saving department:", err);
      setDeptFormErrors({ submit: err.response?.data?.message || "Failed to save department" });
    }
  };

  const handleDelete = async () => {
    try {
      if (confirmDelete.type === "user" && confirmDelete.id) {
        await deleteUser(confirmDelete.id);
        setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
      } else if (confirmDelete.type === "dept" && confirmDelete.id) {
        await deleteDepartment(confirmDelete.id);
        setDepartments(prev => prev.filter(d => d.id !== confirmDelete.id));
      }
      setConfirmDelete({ visible: false, type: "user" });
    } catch (err: any) {
      console.error("Error deleting:", err);
    }
  };

  // Get manager name
  const getManagerName = (managerId?: number, managerName?: string) => {
    if (managerName) return managerName;
    return users.find(u => u.id === managerId)?.name || "Unassigned";
  };

  // Get team members for a department
  const getTeamMembers = (deptId?: number) => {
    if (!deptId) return [];
    return users.filter(u => u.departmentId === deptId);
  };

  // Handle stat card click with auto-scroll
  const handleShowUsersList = () => {
    setShowUsersList(true);
    setTimeout(() => usersListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleShowDepartmentsList = () => {
    setShowDepartmentsList(true);
    setTimeout(() => deptsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  // Add state for filters
  const [userFilters, setUserFilters] = useState({
    search: "",
    role: "",
    department: "",
    active: "",
  });

  const [departmentFilters, setDepartmentFilters] = useState({
    search: "",
  });

  // Filtered data
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilters.search.toLowerCase());
    const matchesRole =
      !userFilters.role || user.roleName === userFilters.role;
    const matchesDepartment =
      !userFilters.department || user.departmentName === userFilters.department;
    const matchesActive =
      userFilters.active === "" ||
      (userFilters.active === "active" && user.active) ||
      (userFilters.active === "inactive" && !user.active);

    return matchesSearch && matchesRole && matchesDepartment && matchesActive;
  });

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(departmentFilters.search.toLowerCase())
  );

  // Simplify sorting to only handle name sorting
  const [nameSortOrder, setNameSortOrder] = useState("asc");

  // Sorting logic for name
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return nameSortOrder === "asc" ? comparison : -comparison;
  });

  // Sorting button UI
  const renderNameSortButton = () => (
    <button
      className="sort-button"
      onClick={() =>
        setNameSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
      }
    >
      Sort: {nameSortOrder === "asc" ? "A to Z" : "Z to A"}
    </button>
  );

  // Filter UI
  const renderUserFilters = () => (
    <div className="filters">
      <input
        type="text"
        placeholder="Search by name or email"
        value={userFilters.search}
        onChange={(e) =>
          setUserFilters((prev) => ({ ...prev, search: e.target.value }))
        }
      />
      <select
        value={userFilters.role}
        onChange={(e) =>
          setUserFilters((prev) => ({ ...prev, role: e.target.value }))
        }
      >
        <option value="">All Roles</option>
        {roles.map((role) => (
          <option key={role.id} value={role.name}>
            {role.name}
          </option>
        ))}
      </select>
      <select
        value={userFilters.department}
        onChange={(e) =>
          setUserFilters((prev) => ({ ...prev, department: e.target.value }))
        }
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.name}>
            {dept.name}
          </option>
        ))}
      </select>
      <select
        value={userFilters.active}
        onChange={(e) =>
          setUserFilters((prev) => ({ ...prev, active: e.target.value }))
        }
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );

  const renderDepartmentFilters = () => (
    <div className="filters">
      <input
        type="text"
        placeholder="Search by name"
        value={departmentFilters.search}
        onChange={(e) =>
          setDepartmentFilters((prev) => ({ ...prev, search: e.target.value }))
        }
      />
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage users and departments</p>
        </div>
      </div>

      {/* Stats Cards with Actions */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content" onClick={handleShowUsersList}>
            <div className="stat-icon-wrapper">
              <Users size={32} color="#0284c7" />
            </div>
            <div className="stat-content-main">
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{loadingUsers ? "..." : users.length}</p>
              <p className="stat-action-text">Manage Users <span className="stat-action-arrow">→</span></p>
            </div>
          </div>
          <button
            className="stat-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeptForm({ visible: false });
              setShowUserForm({ visible: true });
              setUserFormErrors({});
            }}
          >
            <PlusCircle size={18} /> Add User
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-card-content" onClick={handleShowDepartmentsList}>
            <div className="stat-icon-wrapper">
              <Building2 size={32} color="#6366f1" />
            </div>
            <div className="stat-content-main">
              <p className="stat-label">Total Departments</p>
              <p className="stat-value">{loadingDepartments ? "..." : departments.length}</p>
              <p className="stat-action-text">Manage Departments <span className="stat-action-arrow">→</span></p>
            </div>
          </div>
          <button
            className="stat-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowUserForm({ visible: false });
              setShowDeptForm({ visible: true });
              setDeptFormErrors({});
            }}
          >
            <PlusCircle size={18} /> Add Department
          </button>
        </div>
      </div>

      {/* User Management - Toggle visibility */}
      {showUsersList && (
      <div className="management-card" ref={usersListRef}>
        <div className="card-header">
          <h2>User Management</h2>
          <button className="close-section-btn" onClick={() => setShowUsersList(false)}>
            ✕ Hide Users
          </button>
        </div>

        {/* Filters */}
        {renderUserFilters()}

        {/* Sorting Options */}
        {renderNameSortButton()}

        {/* Users Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th style={{ textAlign: "center", width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-message">No users found</td>
                </tr>
              ) : (
                sortedUsers.map(u => (
                  <tr key={u.id}>
                    <td className="user-name">{u.name}</td>
                    <td><span className={`role-badge ${getRoleColor(u.roleName)}`}>{formatRoleName(u.roleName)}</span></td>
                    <td>{u.departmentName || "-"}</td>
                    <td className="actions-cell">
                      <button className="view-btn" title="View Details" onClick={() => setViewUserModal({ visible: true, data: u })}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Department Management - Toggle visibility */}
      {showDepartmentsList && (
      <div className="management-card" ref={deptsListRef}>
        <div className="card-header">
          <h2>Department Management</h2>
          <button className="close-section-btn" onClick={() => setShowDepartmentsList(false)}>
            ✕ Hide Departments
          </button>
        </div>

        {/* Filters */}
        {renderDepartmentFilters()}

        {/* Departments Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Manager</th>
                <th>Employees</th>
                <th style={{ textAlign: "right", width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-message">No departments found</td>
                </tr>
              ) : (
                filteredDepartments.map(d => (
                  <tr key={d.id}>
                    <td className="dept-name">{d.name}</td>
                    <td>{getManagerName(d.managerId, d.managerName)}</td>
                    <td>{users.filter(u => u.departmentId === d.id).length}</td>
                    <td className="actions-cell" style={{ textAlign: "right" }}>
                      <button className="view-btn" title="View Details" onClick={() => setViewDeptModal({ visible: true, data: d })}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* User View Modal */}
      {viewUserModal.visible && viewUserModal.data && (
        <UserViewModal
          user={viewUserModal.data}
          roles={roles}
          departments={departments}
          onClose={() => setViewUserModal({ visible: false })}
          onEdit={() => {
            setShowUserForm({ visible: true, data: viewUserModal.data });
            setViewUserModal({ visible: false });
          }}
          onDelete={() => {
            setConfirmDelete({ visible: true, type: "user", id: viewUserModal.data?.id, name: viewUserModal.data?.name });
            setViewUserModal({ visible: false });
          }}
        />
      )}

      {/* Department View Modal */}
      {viewDeptModal.visible && viewDeptModal.data && (
        <DepartmentViewModal
          department={viewDeptModal.data}
          teamMembers={getTeamMembers(viewDeptModal.data.id)}
          onClose={() => setViewDeptModal({ visible: false })}
          onEdit={() => {
            setShowDeptForm({ visible: true, data: viewDeptModal.data });
            setViewDeptModal({ visible: false });
          }}
          onDelete={() => {
            setConfirmDelete({ visible: true, type: "dept", id: viewDeptModal.data?.id, name: viewDeptModal.data?.name });
            setViewDeptModal({ visible: false });
          }}
        />
      )}

      {/* User Form Modal */}
      {showUserForm.visible && (
        <div className="form-modal-overlay" onClick={() => setShowUserForm({ visible: false })}>
          <div className="form-modal" onClick={e => e.stopPropagation()}>
            <UserForm
              data={showUserForm.data}
              roles={roles}
              departments={departments}
              errors={userFormErrors}
              onSubmit={handleSaveUser}
              onCancel={() => setShowUserForm({ visible: false })}
              isEditing={!!showUserForm.data?.id}
            />
          </div>
        </div>
      )}

      {/* Department Form Modal */}
      {showDeptForm.visible && (
        <div className="form-modal-overlay" onClick={() => setShowDeptForm({ visible: false })}>
          <div className="form-modal" onClick={e => e.stopPropagation()}>
            <DepartmentForm
              data={showDeptForm.data}
              users={users}
              errors={deptFormErrors}
              onSubmit={handleSaveDept}
              onCancel={() => setShowDeptForm({ visible: false })}
              isEditing={!!showDeptForm.data?.id}
            />
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete.visible && (
        <div className="modal-overlay" onClick={() => setConfirmDelete({ visible: false, type: "user" })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setConfirmDelete({ visible: false, type: "user" })}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert-box">
                <AlertCircle size={20} />
                <div>
                  <p>Are you sure you want to delete this {confirmDelete.type === "user" ? "user" : "department"}?</p>
                  <p className="alert-detail">{confirmDelete.name}</p>
                </div>
              </div>
              <div className="confirm-actions">
                <button className="delete-confirm-btn" onClick={handleDelete}>Yes, Delete</button>
                <button className="cancel-confirm-btn" onClick={() => setConfirmDelete({ visible: false, type: "user" })}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// User Form Component
interface UserFormProps {
  data?: Partial<UserDTO>;
  roles: RoleDTO[];
  departments: DepartmentDTO[];
  errors: Record<string, string>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ data, roles, departments, errors, onSubmit, onCancel, isEditing }) => {
  // When editing, find roleId from roleName if not provided
  const getRoleIdFromName = (roleName?: string, roleId?: number) => {
    if (roleId) return roleId;
    if (roleName) {
      const role = roles.find(r => r.name === roleName);
      return role?.id || "";
    }
    return "";
  };

  const [formData, setFormData] = useState({
    id: data?.id,
    name: data?.name || "",
    email: data?.email || "",
    password: "",
    phoneNumber: data?.phoneNumber || "",
    roleId: getRoleIdFromName(data?.roleName, data?.roleId),
    departmentId: data?.departmentId || "",
    passwordChanged: false,
    active: data?.active !== false, // default to true if undefined
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "password") {
      setFormData(prev => ({ ...prev, password: value, passwordChanged: true }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form className="inline-form beautified-form" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      {errors.submit && <div className="error-message"><AlertCircle size={16} /> {errors.submit}</div>}
      <div className="form-row">
        <div className="form-group">
          <label>Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full name" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" disabled={isEditing} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label>Password *</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="10-digit number" maxLength={10} />
          {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
        </div>
        <div className="form-group">
          <label>Role *</label>
          <select name="roleId" value={formData.roleId} onChange={handleChange}>
            <option value="">Select a role</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {errors.roleId && <span className="field-error">{errors.roleId}</span>}
        </div>
        <div className="form-group">
          <label>Department</label>
          <select name="departmentId" value={formData.departmentId} onChange={handleChange}>
            <option value="">No department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {isEditing && (
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Status</label>
            <select name="active" value={formData.active ? "true" : "false"} onChange={e => setFormData(prev => ({ ...prev, active: e.target.value === "true" }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
      </div>
      <div className="form-actions">
        <button type="submit" className="submit-btn">{isEditing ? "Update User" : "Add User"}</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

// Department Form Component
interface DepartmentFormProps {
  data?: Partial<DepartmentDTO>;
  users: UserDTO[];
  errors: Record<string, string>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ data, users, errors, onSubmit, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    id: data?.id,
    name: data?.name || "",
    description: data?.description || "",
    managerId: data?.managerId || "",
  });
  const [showManagerConfirm, setShowManagerConfirm] = useState(false);
  const [pendingManagerId, setPendingManagerId] = useState<string>("");

  // Check if department already has a manager and new manager is being assigned
  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newManagerId = e.target.value;
    if (isEditing && data?.managerId && String(data.managerId) !== newManagerId && newManagerId) {
      setPendingManagerId(newManagerId);
      setShowManagerConfirm(true);
    } else {
      setFormData(prev => ({ ...prev, managerId: newManagerId }));
    }
  };

  const confirmManagerChange = () => {
    setFormData(prev => ({ ...prev, managerId: pendingManagerId }));
    setShowManagerConfirm(false);
  };
  const cancelManagerChange = () => {
    setPendingManagerId("");
    setShowManagerConfirm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
        {errors.submit && <div className="error-message"><AlertCircle size={16} /> {errors.submit}</div>}

        <div className="form-group">
          <label>Department Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter department name" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Department description" rows={3} />
        </div>

        <div className="form-group">
          <label>Manager (optional)</label>
          <select name="managerId" value={formData.managerId} onChange={handleManagerChange}>
            <option value="">No manager assigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">{isEditing ? "Update Department" : "Add Department"}</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
      {showManagerConfirm && (
        <div className="modal-overlay" onClick={cancelManagerChange}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Manager Change</h3>
              <button className="modal-close" onClick={cancelManagerChange}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert-box">
                <AlertCircle size={20} />
                <div>
                  <p>This department already has a manager. Assigning a new manager will demote the previous manager to employee.</p>
                  <p>Do you want to continue?</p>
                </div>
              </div>
            </div>
            <div className="confirm-actions">
              <button className="delete-confirm-btn" onClick={confirmManagerChange}>Yes, Change Manager</button>
              <button className="cancel-confirm-btn" onClick={cancelManagerChange}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// User View Modal Component
interface UserViewModalProps {
  user: UserDTO;
  roles: RoleDTO[];
  departments: DepartmentDTO[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user, departments, onClose, onEdit, onDelete }) => {
  const getDeptName = (deptId?: number) => {
    return departments.find(d => d.id === deptId)?.name || "No Department";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Name</label>
              <p>{user.name}</p>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            <div className="detail-item">
              <label>Phone Number</label>
              <p>{user.phoneNumber || "Not provided"}</p>
            </div>
            <div className="detail-item">
              <label>Role</label>
              <p><span className={`role-badge ${getRoleColor(user.roleName)}`}>{formatRoleName(user.roleName)}</span></p>
            </div>
            <div className="detail-item">
              <label>Department</label>
              <p>{getDeptName(user.departmentId)}</p>
            </div>
          </div>
          <div className="modal-actions">
            <button className="edit-modal-btn" onClick={onEdit}><Edit2 size={16} /> Edit</button>
            <button className="delete-modal-btn" onClick={onDelete}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Department View Modal Component
interface DepartmentViewModalProps {
  department: DepartmentDTO;
  teamMembers: UserDTO[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DepartmentViewModal: React.FC<DepartmentViewModalProps> = ({ department, teamMembers, onClose, onEdit, onDelete }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Department Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Name</label>
              <p>{department.name}</p>
            </div>
            <div className="detail-item">
              <label>Manager</label>
              <p>{department.managerName || "Unassigned"}</p>
            </div>
            <div className="detail-item full-width">
              <label>Description</label>
              <p>{department.description || "No description provided"}</p>
            </div>
          </div>

          <div className="team-members-section">
            <h4>Team Members ({teamMembers.length})</h4>
            {teamMembers.length === 0 ? (
              <p className="no-members">No team members in this department</p>
            ) : (
              <div className="team-members-list">
                {teamMembers.map(member => (
                  <div key={member.id} className="team-member-card">
                    <p className="member-name">{member.name}</p>
                    <p className="member-role"><span className={`role-badge ${getRoleColor(member.roleName)}`}>{formatRoleName(member.roleName)}</span></p>
                    <p className="member-email">{member.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="edit-modal-btn" onClick={onEdit}><Edit2 size={16} /> Edit</button>
            <button className="delete-modal-btn" onClick={onDelete}><Trash2 size={16} /> Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
