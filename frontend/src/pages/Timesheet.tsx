import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getTimesheets,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
  getAssignedProjects,
} from "../services/timesheetService";
import { Plus, X } from "lucide-react";
import "./Timesheet.css";
import "../styles/dashboard-custom.css";

interface TimesheetEntry {
  id?: number;
  workDate: string;
  projectId: number;
  projectName?: string;
  activityType?: string; // type name like "training", "meeting", etc.
  hoursWorked: number;
  description?: string;
  approvalStatus?: string;
}

const Timesheet: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState<TimesheetEntry>({
    workDate: "",
    projectId: 0,
    hoursWorked: 0,
    description: "",
    activityType: "",
  });
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTimesheets();
    fetchAssignedProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const data = await getTimesheets();
      setEntries(
        (data || []).map((t: any) => ({
          id: t.id,
          workDate: t.workDate,
          projectId: t.projectId,
          projectName: t.projectName || t.project?.name,
          hoursWorked: t.hoursWorked,
          description: t.description,
          approvalStatus: t.approvalStatus,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch timesheets:", err);
      setError("Failed to load timesheets");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedProjects = async () => {
    try {
      console.log("🔄 Fetching assigned projects...");
      const projs = await getAssignedProjects(user);
      console.log("✅ Projects fetched:", projs);
      setAssignedProjects(projs || []);
      if (!projs || projs.length === 0) {
        console.warn("⚠️ No projects returned from API. Check if any projects exist in database and are assigned/internal.");
      }
    } catch (err: any) {
      console.error("❌ Failed to fetch assigned projects:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError("Failed to load projects. Check console for details.");
      setAssignedProjects([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "projectId") {
      // projectId select may include activity values prefixed with "act:"
      if (typeof value === "string" && value.startsWith("act:")) {
        const activity = value.slice(4);
        setNewEntry((prev) => ({ ...prev, projectId: 0, activityType: activity }));
      } else {
        setNewEntry((prev) => ({ ...prev, projectId: Number(value), activityType: undefined }));
      }
      return;
    }

    setNewEntry((prev) => ({
      ...prev,
      [name]: name === "hoursWorked" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // require either a selected project OR an activityType
    if (!newEntry.workDate || (!newEntry.projectId && !newEntry.activityType) || newEntry.hoursWorked <= 0) {
      setError("Please fill in all required fields (Date, Project/Activity, Hours)");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        // Update existing timesheet
        await updateTimesheet(editingId, {
          projectId: newEntry.projectId || null,
          workDate: newEntry.workDate,
          hoursWorked: newEntry.hoursWorked,
          description: newEntry.description,
          activityType: newEntry.activityType,
        } as any);
      } else {
        // Create new timesheet - do NOT send userId, backend will use authenticated user
        await createTimesheet({
          projectId: newEntry.projectId || null,
          workDate: newEntry.workDate,
          hoursWorked: newEntry.hoursWorked,
          description: newEntry.description,
          activityType: newEntry.activityType,
        } as any);
      }
      setNewEntry({ workDate: "", projectId: 0, hoursWorked: 0, description: "", activityType: "" });
      setEditingId(null);
      setShowForm(false);
      fetchTimesheets();
    } catch (err: any) {
      console.error("Failed to save timesheet:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to save timesheet";
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: TimesheetEntry) => {
    setNewEntry(entry as TimesheetEntry);
    setEditingId(entry.id || null);
    setShowForm(true);
    setError("");
  };

  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; id?: number }>({ visible: false });
  const handleDelete = (id?: number) => {
    if (!id) return;
    setConfirmDelete({ visible: true, id });
  };
  const handleDeleteConfirm = async () => {
    if (!confirmDelete.id) return;
    try {
      setLoading(true);
      await deleteTimesheet(confirmDelete.id);
      fetchTimesheets();
      setConfirmDelete({ visible: false });
    } catch (err) {
      console.error("Failed to delete timesheet:", err);
      setError("Failed to delete. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setNewEntry({ workDate: "", projectId: 0, hoursWorked: 0, description: "" });
    setError("");
  };


  return (
    <div className="timesheet-page">
      <div className="timesheet-header">
        <div>
          <h1>Timesheets</h1>
          <p className="subtitle">Manage your work hours and timesheet entries</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setError(""); }}>
          <Plus size={20} /> Add Entry
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <div className="form-card">
            <h2>{editingId ? "Edit Timesheet" : "New Timesheet Entry"}</h2>
            <form onSubmit={handleSubmit} className="timesheet-form">
              <div className="form-group">
                <label htmlFor="workDate">Work Date *</label>
                <input
                  type="date"
                  id="workDate"
                  name="workDate"
                  value={newEntry.workDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectId">Work On *</label>
                <select
                  id="projectId"
                  name="projectId"
                  value={
                    newEntry.activityType
                      ? `act:${newEntry.activityType}`
                      : newEntry.projectId
                  }
                  onChange={handleChange}
                  required
                >
                  <option value={0}>Select project or activity</option>
                  <optgroup label="Assigned Projects">
                    {assignedProjects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.projectName}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Internal Activities">
                    <option value="act:training"> Training </option>
                    <option value="act:other"> Other Internal Work</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hoursWorked">Hours Worked *</label>
                <input
                  type="number"
                  id="hoursWorked"
                  name="hoursWorked"
                  placeholder="Enter hours"
                  step="0.5"
                  min="0.5"
                  value={newEntry.hoursWorked}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Add any notes about your work"
                  rows={4}
                  value={newEntry.description || ""}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="timesheets-container">
        {loading && !showForm ? (
          <div className="loading">Loading timesheets...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <p>No timesheet entries yet</p>
            <p className="empty-subtitle">Create your first timesheet entry to get started</p>
          </div>
        ) : (
          <div className="timesheets-grid">
            {entries.map((entry) => (
              <div key={entry.id} className="timesheet-card">
                <div className="card-header">
                  <div>
                    <p className="date">{new Date(entry.workDate).toLocaleDateString()}</p>
                    <p className="project">{entry.projectName || "Unknown Project"}</p>
                  </div>
                  <div
                    className={`status-badge status-${(entry.approvalStatus || '').toLowerCase()}`}
                  >
                    {entry.approvalStatus || "N/A"}
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-group">
                    <span className="label">Hours:</span>
                    <span className="value">{entry.hoursWorked}h</span>
                  </div>
                  {entry.description && (
                    <div className="info-group">
                      <span className="label">Notes:</span>
                      <span className="value">{entry.description}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer" style={{ display: 'flex', justifyContent: entry.approvalStatus === 'PENDING' ? 'space-between' : 'center', alignItems: 'center' }}>
                  {entry.approvalStatus === "PENDING" ? (
                    <>
                      <button
                        style={{ background: 'none', border: 'none', color: '#1677ff', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => handleEdit(entry)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => handleDelete(entry.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <p className="locked-message">Approved timesheets cannot be edited</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Confirm Delete Modal */}
      {confirmDelete.visible && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setConfirmDelete({ visible: false })}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert-box">
                <span role="img" aria-label="alert" style={{ color: '#d32f2f', fontSize: 20, marginRight: 8 }}>⚠️</span>
                <div>
                  <p>Are you sure you want to delete this timesheet entry?</p>
                </div>
              </div>
              <div className="confirm-actions">
                <button className="delete-confirm-btn" style={{ background: '#d32f2f', color: '#fff', marginRight: 12, padding: '8px 18px', border: 'none', borderRadius: 5, fontWeight: 600, cursor: 'pointer' }} onClick={handleDeleteConfirm}>Yes, Delete</button>
                <button className="cancel-confirm-btn" style={{ background: '#f3f4f6', color: '#222', padding: '8px 18px', border: 'none', borderRadius: 5, fontWeight: 500, cursor: 'pointer' }} onClick={() => setConfirmDelete({ visible: false })}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;
