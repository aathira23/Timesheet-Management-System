import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  getProjects,
  createProject,
  getProjectsForManager,
  getAssignedUsersForProject
} from "../services/projectService";
import { getAllUsers } from "../services/adminService";
import "./Projects.css";

interface ProjectItem {
  id: number;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  managerId?: number;
}

const Projects: React.FC = () => {
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
    const [roleMap, setRoleMap] = useState<{ [userId: number]: string }>({});
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Manager create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);

  // Assign modal
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showAssignFor, setShowAssignFor] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Departments state
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);

  // Add state for edit modal and delete confirmation
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  useEffect(() => {
    fetchProjects();
    if (user && user.role === "manager") {
      fetchUsers();
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = user?.role === "manager" && user.id
        ? await getProjectsForManager(user.id)
        : await getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await getAllUsers();
      // Find manager's departmentId from allUsers
      const managerUser = users.find((u: any) => u.id === user?.id);
      const deptId = managerUser?.departmentId;
      if (!deptId) {
        setAvailableUsers([]);
        return;
      }
      const employees = users.filter((u: any) => {
        const role = u.roleName || u.role;
        return (role === "ROLE_EMPLOYEE" || role === "EMPLOYEE" || role === "employee") && u.departmentId === deptId;
      });
      setAvailableUsers(employees || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setAvailableUsers([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const allDepartments = await api.get("/api/departments");
      setAvailableDepartments(allDepartments.data || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setAvailableDepartments([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Project name is required.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Start date and end date are required.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }
    if (!user?.departmentId) {
      alert("Manager department not found. Cannot create project.");
      return;
    }
    try {
      const projectPayload: any = {
        name,
        description,
        startDate,
        endDate,
        departmentId: user.departmentId // Set departmentId automatically
      };
      await createProject(projectPayload);
      alert("Project created successfully.");
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      fetchProjects();
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project. Check console for details.");
    }
  };

  const openAssign = (projectId: number) => {
    setShowAssignFor(projectId);
    setSelectedUserIds([]);
    setRoleMap({});
    // Fetch assigned users for this project
    getAssignedUsersForProject(projectId).then((assigned) => {
      if (Array.isArray(assigned)) {
        setAssignedUserIds(assigned.map((u: any) => u.id));
      } else {
        setAssignedUserIds([]);
      }
    });
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAssign = async () => {
    if (!showAssignFor) return;
    // Prepare batch assignments
    const assignments = selectedUserIds.map((userId) => ({
      userId,
      projectId: showAssignFor,
      roleInProject: roleMap[userId] || "DEVELOPER" // Default role
    }));
    try {
      // Submit each assignment
      await Promise.all(assignments.map((dto) =>
        api.post("/api/project_assignments", dto)
      ));
      alert("Assigned users to project");
      setShowAssignFor(null);
      setSelectedUserIds([]);
      setRoleMap({});
      fetchProjects();
    } catch (err) {
      console.error("Failed to assign users:", err);
      alert("Failed to assign users. Check console for details.");
    }
  };

  // Edit handler
  const handleEdit = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setEditProjectId(projectId);
      setEditName(project.name || "");
      setEditDescription(project.description || "");
      setEditStartDate(project.startDate || "");
      setEditEndDate(project.endDate || "");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Project name is required.");
      return;
    }
    if (!editStartDate || !editEndDate) {
      alert("Start date and end date are required.");
      return;
    }
    if (new Date(editStartDate) > new Date(editEndDate)) {
      alert("Start date cannot be after end date.");
      return;
    }
    try {
      await api.put(`/api/projects/${editProjectId}`, {
        name: editName,
        description: editDescription,
        startDate: editStartDate,
        endDate: editEndDate,
      });
      setEditProjectId(null);
      fetchProjects();
    } catch (err) {
      alert("Failed to update project.");
    }
  };

  // Delete handler
  const handleDelete = (projectId: number) => {
    setDeleteProjectId(projectId);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/projects/${deleteProjectId}`);
      setDeleteProjectId(null);
      fetchProjects();
    } catch (err) {
      alert("Failed to delete project.");
    }
  };

  const cancelDelete = () => setDeleteProjectId(null);

  return (
    <div className="projects-container">
      <div className="page-header">
        <h1>Projects</h1>
        <p className="subtitle">{user?.role === "manager" ? "Manage your projects and assignments." : "All projects"}</p>
      </div>

      {user?.role === "manager" && (
        <div className="card project-form-card" style={{ padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Create Project</h3>
          <form className="project-form styled-form" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-row-grid">
              <label className="form-label form-label-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                Project Name<span className="required">*</span>
                <input
                  className="input input-lg"
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                />
              </label>
              <label className="form-label form-label-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                Start Date<span className="required">*</span>
                <input
                  className="input input-lg"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                />
              </label>
              <label className="form-label form-label-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                End Date<span className="required">*</span>
                <input
                  className="input input-lg"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                />
              </label>
            </div>
            <div className="form-row" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                Description
                <textarea
                  className="input input-lg"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb', resize: 'vertical' }}
                />
              </label>
            </div>
            {/* Department is set automatically for manager, so no field shown */}
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary btn-lg">Create Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Project List</h3>
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                {user?.role === "manager" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.status || "\u2014"}</td>
                  <td>{p.startDate || "\u2014"}</td>
                  <td>{p.endDate || "\u2014"}</td>
                  {user?.role === "manager" && (
                    <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="btn-assign btn-md" onClick={() => openAssign(p.id)}>Assign</button>
                      <button className="btn-edit btn-md" onClick={() => handleEdit(p.id)}>Edit</button>
                      <button className="btn-delete btn-md" style={{ background: '#ef4444', color: '#fff' }} onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Edit Project Modal */}
      {editProjectId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500, padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Edit Project</h3>
              <button className="modal-close" onClick={() => setEditProjectId(null)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <form className="modal-body" onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Project Name
                <input className="input input-lg" value={editName} onChange={e => setEditName(e.target.value)} required style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Start Date
                  <input className="input input-lg" type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} required style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                </label>
                <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>End Date
                  <input className="input input-lg" type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} required style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                </label>
              </div>
              <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Description
                <textarea className="input input-lg" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} style={{ padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb', resize: 'vertical' }} />
              </label>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary btn-lg" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', borderRadius: '6px' }}>Save</button>
                <button type="button" className="btn-secondary btn-lg" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', borderRadius: '6px' }} onClick={() => setEditProjectId(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteProjectId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420, padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#991b1b' }}>Delete Project</h3>
              <button className="modal-close" onClick={cancelDelete} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body" style={{ marginBottom: '1.2rem', color: '#991b1b', fontSize: '1rem' }}>
              <p>Are you sure you want to delete this project?</p>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-delete btn-md" style={{ background: '#ef4444', color: '#fff' }} onClick={confirmDelete}>Delete</button>
              <button className="btn-secondary btn-md" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
{showAssignFor && (
  <div className="assign-modal-overlay">
    <div className="assign-modal">
      <h4>Assign members to project</h4>
      <div className="assign-list">
        {availableUsers.length === 0 ? (
          <p>No team members available.</p>
        ) : (
          availableUsers.map((u) => {
            const isAssigned = assignedUserIds.includes(u.id);
            const isSelected = selectedUserIds.includes(u.id);

            return (
              <div key={u.id} className="assign-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '8px 0' }}>
                <input
                  type="checkbox"
                  checked={isAssigned || isSelected}
                  onChange={() => {
                    if (isAssigned) {
                      setAssignedUserIds(prev => prev.filter(id => id !== u.id));
                    } else {
                      toggleSelectUser(u.id);
                    }
                  }}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ minWidth: 180, fontWeight: 500 }}>{u.name}</span>
                <span style={{ minWidth: 180, color: '#64748b', fontSize: '14px' }}>{u.email}</span>
                {(isAssigned || isSelected) && (
                  <select
                    value={roleMap[u.id] || "DEVELOPER"}
                    onChange={(e) =>
                      setRoleMap((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                    className="role-select"
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', minWidth: 120 }}
                  >
                    <option value="DEVELOPER">Developer</option>
                    <option value="TESTER">Tester</option>
                    <option value="LEAD">Lead</option>
                  </select>
                )}
                {isAssigned && <span style={{ color: "#10b981", marginLeft: '8px', fontWeight: 500 }}>— Assigned</span>}
              </div>
            );
          })
        )}
      </div>
      <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn-assign" onClick={handleAssign}>Save</button>
        <button className="btn-cancel" onClick={() => setShowAssignFor(null)}>Cancel</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Projects;
