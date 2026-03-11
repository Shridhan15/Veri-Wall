import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Key,
  Fingerprint,
  RefreshCcw,
  ShieldAlert,
  FileCheck,
  Clock,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { policyAPI } from "../api";
import PolicyModal from "../components/PolicyModal"; // Import the modal!

const Dashboard = ({ adminName, userRole }) => {
  const [data, setData] = useState({
    stats: { active: 0, pending: 0, admins: 0, alerts: 0 },
    lists: { active: [], pending: [], alerts: [] },
  });
  const [loading, setLoading] = useState(true);

  // NEW: Modal State
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (policy) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await policyAPI.getStats();
        setData({
          stats: {
            active: res.data.active_policies,
            pending: res.data.pending_signatures,
            admins: res.data.verified_admins,
            alerts: res.data.alerts,
          },
          lists: {
            active: res.data.active_list,
            pending: res.data.pending_list,
            alerts: res.data.alert_list,
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [adminName]);

  if (loading)
    return (
      <div className="p-8 text-emerald-400 font-mono">
        Initializing VeriWall Systems...
      </div>
    );

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">System Overview</h1>
        <button
          onClick={() => window.location.reload()}
          className="text-slate-500 hover:text-white transition-colors bg-slate-900 p-2 rounded-lg border border-slate-800"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Policies"
          value={data.stats.active}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending Review"
          value={data.stats.pending}
          icon={Fingerprint}
          color="bg-amber-500"
        />
        <StatCard
          title="Verified Admins"
          value={data.stats.admins}
          icon={Key}
          color="bg-blue-500"
        />
        <StatCard
          title="Security Alerts"
          value={data.stats.alerts}
          icon={AlertCircle}
          color="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Policies */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-slate-300 flex items-center gap-2">
              <FileCheck className="text-emerald-400" size={20} /> Active
              Deployments
            </h2>
            <div className="space-y-3">
              {data.lists.active.length === 0 ? (
                <p className="text-slate-500 text-sm font-mono p-4 text-center border border-slate-800 border-dashed rounded-lg">
                  No active policies deployed.
                </p>
              ) : (
                data.lists.active.map((p) => (
                  <div
                    key={p.fileName}
                    className="flex justify-between items-center bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-emerald-400 font-mono text-sm">
                        {p.policyName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
                        File: {p.fileName} | Deployed by: {p.creator}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-800/50 font-bold uppercase tracking-widest hidden sm:inline-block">
                        Enforced
                      </span>
                      {/* Review Button */}
                      <button
                        onClick={() => openModal(p)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-600"
                      >
                        <Eye size={14} /> Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pending & Alerts */}
        <div className="space-y-6">
          {/* Quarantined / Alerts */}
          {data.lists.alerts.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4 text-rose-500 flex items-center gap-2">
                <ShieldAlert size={20} /> Security Alerts
              </h2>
              <div className="space-y-3">
                {data.lists.alerts.map((p) => (
                  <div
                    key={p.fileName}
                    className="bg-slate-950 p-4 rounded-lg border border-rose-900/50 flex flex-col gap-3"
                  >
                    <div>
                      <p className="font-bold text-rose-400 font-mono text-xs truncate">
                        {p.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Tamper caught by:{" "}
                        <span className="text-rose-300 font-bold">
                          {p.detected_by}
                        </span>
                      </p>
                    </div>
                    {/* Review Button */}
                    <button
                      onClick={() => openModal(p)}
                      className="self-start flex items-center gap-1.5 bg-rose-900 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-rose-700"
                    >
                      <Eye size={14} /> Inspect Payload
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Policies */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-slate-300 flex items-center gap-2">
              <Clock className="text-amber-500" size={20} /> Pending Actions
            </h2>
            <div className="space-y-3">
              {data.lists.pending.length === 0 ? (
                <p className="text-slate-500 text-sm font-mono p-4 text-center border border-slate-800 border-dashed rounded-lg">
                  All caught up.
                </p>
              ) : (
                data.lists.pending.map((p) => (
                  <div
                    key={p.fileName}
                    className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-3"
                  >
                    <div>
                      <p className="font-bold text-slate-200 text-sm">
                        {p.policyName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Drafted by: {p.creator}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[10px] px-2 py-1 rounded border font-bold uppercase ${p.status === "Verified" ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : "bg-amber-900/20 text-amber-400 border-amber-800/50"}`}
                      >
                        {p.status} ({p.sig_count} Sigs)
                      </span>
                      {/* Review Button */}
                      <button
                        onClick={() => openModal(p)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-600"
                      >
                        <Eye size={14} /> Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mount the Modal! */}
      <PolicyModal
        policy={selectedPolicy}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl shadow-lg transition-all group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-3xl font-bold mt-1 text-white group-hover:text-emerald-400 transition-colors">
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-xl shadow-inner ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

export default Dashboard;
