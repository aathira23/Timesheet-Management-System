import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getTimesheets,
  getAssignedProjects,
  createTimesheet,
} from "../services/timesheetService";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
} from "lucide-react";
import "./CalendarView.css";

interface TimesheetEntry {
  id?: number;
  workDate: string;
  projectId: number;
  projectName?: string;
  hoursWorked: number;
  description?: string;
  approvalStatus?: string;
}

type ViewType = "day" | "week" | "month";

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [formData, setFormData] = useState<any>({
    projectId: 0,
    hoursWorked: 0,
    description: "",
    activityType: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timesheetData, projectData] = await Promise.all([
        getTimesheets(),
        getAssignedProjects(user),
      ]);
      setTimesheets(timesheetData || []);
      setProjects(projectData || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const getTimesheetsForDate = (date: Date): TimesheetEntry[] => {
    const dateStr = date.toISOString().split("T")[0];
    return timesheets.filter((ts) => ts.workDate === dateStr);
  };

  const getTotalHoursForDate = (date: Date): number => {
    return getTimesheetsForDate(date).reduce((sum, ts) => sum + ts.hoursWorked, 0);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddTimesheet = (date: Date) => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setFormData({ projectId: 0, hoursWorked: 0, description: "" });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if ((!formData.projectId && !formData.activityType) || formData.hoursWorked <= 0) {
      setError("Please select a project or activity and enter hours");
      return;
    }

    try {
      setLoading(true);
      await createTimesheet({
        projectId: formData.projectId || null,
        workDate: selectedDate,
        hoursWorked: formData.hoursWorked,
        description: formData.description,
        activityType: formData.activityType,
      } as any);
      setShowForm(false);
      setFormData({ projectId: 0, hoursWorked: 0, description: "", activityType: "" });
      fetchData();
    } catch (err: any) {
      console.error("Failed to create timesheet:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to create timesheet";
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => (
            <div
              key={`${weekIdx}-${dayIdx}`}
              className={`calendar-day ${
                !day ? "empty" : ""
              } ${
                day &&
                day.toDateString() === new Date().toDateString()
                  ? "today"
                  : ""
              } ${
                day && getTimesheetsForDate(day).length > 0 ? "has-entries" : ""
              }`}
            >
              {day && (
                <>
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-content">
                    {getTimesheetsForDate(day).length > 0 && (
                      <div className="timesheets-indicator">
                        <p className="hours-badge">
                          {getTotalHoursForDate(day).toFixed(1)}h
                        </p>
                        <div className="entries-count">
                          {getTimesheetsForDate(day).length} entries
                        </div>
                      </div>
                    )}
                    <button
                      className="btn-add-day"
                      onClick={() => handleAddTimesheet(day)}
                      title="Add timesheet"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {getTimesheetsForDate(day).length > 0 && (
                    <div className="has-entries-indicator">
                      <span className="indicator-dot"></span>
                      <span className="indicator-dot"></span>
                      <span className="indicator-dot"></span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="week-view-container">
        <div className="week-header">
          {weekDays.map((day) => (
            <div 
              key={day.toISOString()} 
              className={`week-day-header ${
                getTimesheetsForDate(day).length > 0 ? "has-entries" : ""
              }`}
            >
              <div className="day-name">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div
                className={`day-date ${
                  day.toDateString() === new Date().toDateString() ? "today" : ""
                }`}
              >
                {day.getDate()}
              </div>
              {getTimesheetsForDate(day).length > 0 && (
                <div className="week-entry-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="week-content">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="week-day-column">
              <div className="day-timesheets">
                {getTimesheetsForDate(day).length > 0 ? (
                  getTimesheetsForDate(day).map((ts, idx) => (
                    <div key={idx} className="timesheet-entry-card">
                      <p className="entry-project">{ts.projectName}</p>
                      <p className="entry-hours">{ts.hoursWorked}h</p>
                      {ts.description && (
                        <p className="entry-description">{ts.description}</p>
                      )}
                      <span
                        className="entry-status"
                        style={{
                          background:
                            ts.approvalStatus === "APPROVED"
                              ? "#10b981"
                              : ts.approvalStatus === "REJECTED"
                              ? "#ef4444"
                              : "#f59e0b",
                        }}
                      >
                        {ts.approvalStatus}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="no-entries">No entries</div>
                )}
              </div>
              <button
                className="btn-add-week"
                onClick={() => handleAddTimesheet(day)}
                title="Add timesheet"
              >
                <Plus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const todayTimesheets = getTimesheetsForDate(currentDate);
    const hasEntries = todayTimesheets.length > 0;

    return (
      <div className="day-view-container">
        <div className="day-view-header">
          <div className="day-view-title">
            <h2>
              {currentDate.toLocaleDateString("en-US", { 
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {hasEntries && (
                <span className="entry-indicator-badge">
                  {todayTimesheets.length} Entry{todayTimesheets.length !== 1 ? "ies" : ""}
                </span>
              )}
            </h2>
            <p className="total-hours">
              Total Hours: <strong>{getTotalHoursForDate(currentDate).toFixed(1)}h</strong>
            </p>
          </div>
          <button
            className="btn-primary-day"
            onClick={() => handleAddTimesheet(currentDate)}
          >
            <Plus size={20} /> Add Timesheet
          </button>
        </div>

        <div className="day-entries">
          {todayTimesheets.length > 0 ? (
            todayTimesheets.map((ts, idx) => (
              <div key={idx} className="day-entry-card">
                <div className="entry-left">
                  <h3>{ts.projectName}</h3>
                  <p className="entry-desc">{ts.description || "No description"}</p>
                </div>
                <div className="entry-right">
                  <p className="entry-hours-large">{ts.hoursWorked}h</p>
                  <span
                    className="entry-status-large"
                    style={{
                      background:
                        ts.approvalStatus === "APPROVED"
                          ? "#10b981"
                          : ts.approvalStatus === "REJECTED"
                          ? "#ef4444"
                          : "#f59e0b",
                    }}
                  >
                    {ts.approvalStatus}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-day">
              <Clock size={48} />
              <p>No timesheets logged for this day</p>
              <button
                className="btn-secondary"
                onClick={() => handleAddTimesheet(currentDate)}
              >
                Add Your First Entry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '16px 20px', marginBottom: 20, color: '#ad6800', fontWeight: 500, fontSize: 18, textAlign: 'center' }}>
        Select a date on the calendar below to add a timesheet entry for that day.
      </div>
      <div className="calendar-header">
        <div>
          <h1>Calendar View</h1>
          <p className="subtitle">Manage your timesheets by day, week, or month</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      <div className="calendar-controls">
        <div className="view-controls">
          <button
            className={`view-btn ${viewType === "day" ? "active" : ""}`}
            onClick={() => setViewType("day")}
          >
            Day
          </button>
          <button
            className={`view-btn ${viewType === "week" ? "active" : ""}`}
            onClick={() => setViewType("week")}
          >
            Week
          </button>
          <button
            className={`view-btn ${viewType === "month" ? "active" : ""}`}
            onClick={() => setViewType("month")}
          >
            Month
          </button>
        </div>

        <div className="nav-controls">
          <button className="nav-btn" onClick={handlePrevMonth} title="Previous">
            <ChevronLeft size={20} />
          </button>
          <button className="nav-btn today-btn" onClick={handleToday}>
            Today
          </button>
          <button className="nav-btn" onClick={handleNextMonth} title="Next">
            <ChevronRight size={20} />
          </button>
          <div className="current-date">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="calendar-container">
        {loading ? (
          <div className="loading">Loading calendar...</div>
        ) : viewType === "month" ? (
          renderMonthView()
        ) : viewType === "week" ? (
          renderWeekView()
        ) : (
          renderDayView()
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Timesheet Entry</h2>
              <button
                className="btn-close"
                onClick={() => setShowForm(false)}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="timesheet-form">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="text"
                  value={new Date(selectedDate).toLocaleDateString()}
                  disabled
                  className="date-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="projectId">Work On *</label>
                <select
                  id="projectId"
                  value={
                    formData.activityType
                      ? `act:${formData.activityType}`
                      : formData.projectId
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (typeof value === "string" && value.startsWith("act:")) {
                      setFormData({ ...formData, projectId: 0, activityType: value.slice(4) });
                    } else {
                      setFormData({ ...formData, projectId: Number(value), activityType: undefined });
                    }
                  }}
                  required
                >
                  <option value={0}>Select project or activity</option>
                  <optgroup label="Assigned Projects">
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Internal Activities">
                    <option value="act:training"> Training & Development</option>
                    <option value="act:other"> Other Internal Work</option>
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hoursWorked">Hours Worked *</label>
                <input
                  type="number"
                  id="hoursWorked"
                  value={formData.hoursWorked}
                  onChange={(e) =>
                    setFormData({ ...formData, hoursWorked: Number(e.target.value) })
                  }
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="Enter hours"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Add notes about your work"
                  rows={4}
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Timesheet"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
