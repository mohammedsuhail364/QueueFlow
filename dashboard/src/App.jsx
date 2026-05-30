import { useState, useEffect } from "react";

const API = "http://localhost:3000";

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        padding: "1.25rem",
        flex: 1,
        minWidth: "120px",
      }}
    >
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "32px", fontWeight: "600", color }}>{value}</div>
    </div>
  );
}

export default function App() {
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    failed: 0,
    dlq: 0,
  });
  const [jobType, setJobType] = useState("send_email");
  const [priority, setPriority] = useState("low");
  const [lastId, setLastId] = useState(null);

  const fetchStats = async () => {
    const res = await fetch(`${API}/jobs/stats`);
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const submitJob = async () => {
    const res = await fetch(`${API}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: jobType,
        priority,
        data: { to: "test@gmail.com" },
      }),
    });
    const data = await res.json();
    setLastId(data.id);
  };

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "2rem auto",
        padding: "0 1rem",
        fontFamily: "monospace",
      }}
    >
      <h1
        style={{ fontSize: "20px", fontWeight: "600", marginBottom: "1.5rem" }}
      >
        QueueFlow dashboard
      </h1>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <StatCard label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard label="Completed" value={stats.completed} color="#10b981" />
        <StatCard label="Failed" value={stats.failed} color="#ef4444" />
        <StatCard label="DLQ" value={stats.dlq} color="#6b7280" />
      </div>

      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}
        >
          Submit a job
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
            }}
          >
            <option value="send_email">send_email</option>
            <option value="send_sms">send_sms</option>
            <option value="generate_invoice">generate_invoice</option>
            <option value="resize_image">resize_image</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
            }}
          >
            <option value="high">high priority</option>
            <option value="low">low priority</option>
          </select>
          <button
            onClick={submitJob}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              background: "#111",
              color: "#fff",
              border: "none",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
        {lastId && (
          <div
            style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}
          >
            Last job ID:{" "}
            <span style={{ fontFamily: "monospace", color: "#111" }}>
              {lastId}
            </span>
          </div>
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "right" }}>
        auto-refreshes every 3s
      </div>
    </div>
  );
}
