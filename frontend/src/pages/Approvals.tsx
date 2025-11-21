import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getApprovalsForManager } from "../services/approvalService";
import { updateApprovalStatus } from "../services/approvalService";
import api from "../services/api";
import "./Approvals.css";

interface PendingApproval {
  id: number;
  employeeName: string;
  projectName: string;
  hoursLogged: number;
  submittedDate: string;
  approvalStatus?: string;
}

interface AllApproval {
  id: number;
  employeeName?: string;
  projectName?: string;
  status: string;
  submittedDate?: string;
  hoursLogged?: number;
  managerId?: number;
  remarks?: string;
  description?: string;
}

const Approvals: React.FC = () => {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [allApprovals, setAllApprovals] = useState<AllApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [viewAllApproved, setViewAllApproved] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<AllApproval | null>(null);

  useEffect(() => {
    if (user && user.id) fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchApprovals = async () => {
    if (!user || !user.id) return;
    try {
      setLoading(true);
      const approvals = await getApprovalsForManager(user.id);
      // Pending = status PENDING
      setPending(
        (approvals || [])
          .filter(a => a.status === "PENDING")
          .map(a => ({
            id: a.id,
            employeeName: a.employeeName || "Unknown User",
            projectName: a.projectName || "Unknown Project",
            hoursLogged: a.hoursLogged || 0,
            submittedDate: a.submittedDate || "N/A",
            approvalStatus: a.status,
          }))
      );
      setAllApprovals(approvals || []);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (timesheetId: number) => {
    if (!window.confirm("Approve this timesheet?")) return;
    try {
      await updateApprovalStatus(timesheetId, "APPROVED", "");
      await fetchApprovals();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve. See console for details.");
    }
  };

  const handleReject = async (timesheetId: number) => {
    if (!window.confirm("Reject this timesheet?")) return;
    try {
      await updateApprovalStatus(timesheetId, "REJECTED", "");
      await fetchApprovals();
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject. See console for details.");
    }
  };

  const filteredPending = pending.filter(
    p =>
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActioned = allApprovals
    .filter(a => ["APPROVED", "REJECTED"].includes(a.status) && user && a.managerId === user.id)
    .filter(a =>
      (a.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.projectName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const sortedActioned = filteredActioned.sort((a, b) => {
    const dateA = a.submittedDate ? new Date(a.submittedDate).getTime() : 0;
    const dateB = b.submittedDate ? new Date(b.submittedDate).getTime() : 0;
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="approvals-page">
      <div className="page-header">
        <h1>Approvals</h1>
        <p className="subtitle">Review and manage timesheet approvals for your team.</p>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by employee or project..."
          className="search-input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="approvals-grid">
        {/* Pending Approvals */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pending Approvals</h3>
            {pending.length > 5 && (
              <span className="view-all" onClick={() => setViewAllApproved(prev => !prev)}>
                {viewAllApproved ? "View Less" : "View All"}
              </span>
            )}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : filteredPending.length === 0 ? (
            <p>No pending approvals.</p>
          ) : (
            <div className="approval-list">
              {filteredPending.map(approval => (
                <div key={approval.id} className="approval-item">
                  <div className="approval-info">
                    <p className="approval-employee">{approval.employeeName}</p>
                    <p className="approval-project">{approval.projectName}</p>
                    <p className="approval-date">{approval.submittedDate}</p>
                  </div>
                  <div className="approval-hours">{approval.hoursLogged.toFixed(1)}h</div>
                  <div className="approval-actions">
                    <button className="btn-approve btn-md" onClick={() => handleApprove(approval.id)}>
                      Approve
                    </button>
                    <button className="btn-reject btn-md" onClick={() => handleReject(approval.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actioned Timesheets */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Actioned Timesheets</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as "newest" | "oldest")}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              {filteredActioned.length > 5 && (
                <span className="view-all" onClick={() => setViewAllApproved(prev => !prev)}>
                  {viewAllApproved ? "View Less" : "View All"}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : sortedActioned.length === 0 ? (
            <p>No actioned timesheets found.</p>
          ) : (
            <div className="approval-list">
              {(viewAllApproved ? sortedActioned : sortedActioned.slice(0, 5)).map(a => (
                <div key={a.id} className="approval-item clickable" onClick={() => setSelectedTimesheet(a)}>
                  <div className="approval-info">
                    <p className="approval-employee">{a.employeeName || "Unknown User"}</p>
                    <p className="approval-project">{a.projectName || "Unknown Project"}</p>
                    <p className="approval-date">{a.submittedDate ? new Date(a.submittedDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div className="approval-hours">{a.hoursLogged ? a.hoursLogged.toFixed(1) + "h" : "N/A"}</div>
                  <div className="approval-actions">
                    <span className={`history-status ${a.status.toLowerCase()}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Timesheet View Modal */}
        {selectedTimesheet && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 480, padding: '2rem', borderRadius: '10px', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}>
              <div className="modal-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Timesheet Details</h3>
                <button className="modal-close" onClick={() => setSelectedTimesheet(null)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><strong>Employee:</strong> {selectedTimesheet.employeeName}</div>
                <div><strong>Project:</strong> {selectedTimesheet.projectName}</div>
                <div><strong>Date:</strong> {selectedTimesheet.submittedDate}</div>
                <div><strong>Hours:</strong> {selectedTimesheet.hoursLogged}</div>
                <div><strong>Status:</strong> {selectedTimesheet.status}</div>
                {selectedTimesheet.remarks && <div><strong>Remarks:</strong> {selectedTimesheet.remarks}</div>}
                {selectedTimesheet.description && <div><strong>Description:</strong> {selectedTimesheet.description}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
