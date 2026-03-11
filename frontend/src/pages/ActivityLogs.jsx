import React, { useState, useEffect } from "react";
import {
  Activity,
  ShieldAlert,
  CheckCircle,
  Info,
  AlertTriangle,
  Clock,
  Code,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { policyAPI } from "../api";

// Sub-component for individual log rows to handle their own collapse/expand state
const LogItem = ({ log, style, formatDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col gap-3">
      {/* Main Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Timestamp */}
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] md:w-48 shrink-0">
          <Clock size={12} />
          {formatDate(log.timestamp)}
        </div>

        {/* Action Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border md:w-40 shrink-0 ${style.bg} ${style.color}`}
        >
          {style.icon}
          {log.action.replace(/_/g, " ")}
        </div>

        {/* Details Text */}
        <div className="flex-1 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-300">{log.details}</p>

          {/* View Payload Button */}
          {log.payload && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors shrink-0"
            >
              <Code size={12} />
              {isExpanded ? "Hide Details" : "View Details"}
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* User */}
        <div className="text-xs font-mono font-bold text-slate-400 md:w-32 shrink-0 md:text-right">
          <span className="text-slate-600 font-sans font-normal mr-1">
            Actor:
          </span>
          {log.user}
        </div>
      </div>

      {/* Expanded Payload Section */}
      {isExpanded && log.payload && (
        <div className="mt-2 ml-0 md:ml-[13rem] bg-slate-950 p-4 rounded-xl border border-slate-700 shadow-inner animate-in slide-in-from-top-2 duration-200">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <Code size={12} /> Forensic Snapshot
          </p>
          <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await policyAPI.getActivityLogs();
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "danger":
        return {
          icon: <ShieldAlert size={14} />,
          color: "text-rose-400",
          bg: "bg-rose-500/10 border-rose-500/20",
        };
      case "success":
        return {
          icon: <CheckCircle size={14} />,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={14} />,
          color: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
        };
      default:
        return {
          icon: <Info size={14} />,
          color: "text-blue-400",
          bg: "bg-blue-500/10 border-blue-500/20",
        };
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-lg">
            <Activity className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">System Event Logs</h1>
            <p className="text-slate-500 text-sm mt-1">
              Immutable forensic timeline with payload snapshots.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-sm">
              Loading telemetry data...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-sm">
              No events logged yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {logs.map((log, index) => (
                <LogItem
                  key={index}
                  log={log}
                  style={getSeverityStyles(log.severity)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
