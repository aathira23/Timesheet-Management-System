import React, { useEffect, useState } from "react";

interface Report {
  id: number;
  name: string;
  createdAt: string;
  type: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const dummyReports: Report[] = [
      { id: 1, name: "Timesheet Summary - Nov 2025", createdAt: "2025-11-15", type: "PDF" },
      { id: 2, name: "Project Status Report", createdAt: "2025-11-10", type: "Excel" },
    ];
    setReports(dummyReports);
  }, []);

  return (
    <div className="reports-container">
      <h1>Reports</h1>
      <table>
        <thead>
          <tr>
            <th>Report Name</th>
            <th>Created At</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.name}</td>
              <td>{report.createdAt}</td>
              <td>{report.type}</td>
              <td>
                <button>View</button>
                <button>Download</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;
