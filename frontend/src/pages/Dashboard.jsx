import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Key,
  Fingerprint,
  RefreshCcw,
  PenTool,
} from "lucide-react";
import { policyAPI } from "../api";
import { Link } from "react-router-dom"; // Add this import

const Dashboard = ({ adminName, userRole }) => {
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    admins: 0,
    alerts: 0,
  });
  const [pendingPolicies, setPendingPolicies] = useState([]); // New state for action items
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load Stats
        const statsRes = await policyAPI.getStats();
        setStats({
          active: statsRes.data.active_policies,
          pending: statsRes.data.pending_signatures,
          admins: statsRes.data.verified_admins,
          alerts: statsRes.data.alerts,
        });

        // 2. Load Policies to find which ones need YOUR signature
        const policyRes = await policyAPI.listPolicies();

        // Filter policies: Needs to be Pending, NOT created by you, and NOT already signed by you
        const actionRequired = policyRes.data.filter((p) => {
          const isPending = p.status === "Pending";
          const notCreator = p.creator !== adminName;
          const notSigned = !(p.signatures || []).some(
            (sig) => sig.admin === adminName,
          );
          return isPending && notCreator && notSigned;
        });

        setPendingPolicies(actionRequired);
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
          className="text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Active Policies"
          value={stats.active}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Fingerprint}
          color="bg-amber-500"
        />
        <StatCard
          title="Verified Admins"
          value={stats.admins}
          icon={Key}
          color="bg-blue-500"
        />
        <StatCard
          title="Security Alerts"
          value={stats.alerts}
          icon={AlertCircle}
          color="bg-rose-500"
        />
      </div>

      {/* NEW: Action Required Section */}
      {userRole === "admin" && pendingPolicies.length > 0 && (
        <div className="mb-10 bg-amber-900/20 border border-amber-500/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
            <Fingerprint size={20} /> Action Required: Pending Your Signature
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {pendingPolicies.map((p) => (
              <div
                key={p.fileName}
                className="flex justify-between items-center bg-slate-900 border border-slate-700 p-4 rounded-lg"
              >
                <div>
                  <p className="font-mono font-bold text-emerald-400">
                    {p.fileName}
                  </p>
                  <p className="text-xs text-slate-500 uppercase mt-1">
                    Drafted by: {p.creator}
                  </p>
                </div>
                {/* Redirects to Audit Log so they can sign it */}
                <Link
                  to="/policies"
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-900/20"
                >
                  <PenTool size={16} /> Review & Sign
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4 text-slate-400">
          Integrity Health
        </h2>
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            stats.active > 0
              ? "bg-emerald-900/10 border-emerald-500/30 text-emerald-400"
              : "bg-slate-900/20 border-slate-700 text-slate-500"
          }`}
        >
          <CheckCircle2 size={20} />
          <p className="font-mono text-sm uppercase tracking-widest">
            {stats.active > 0
              ? "Hash Chain Intact: Cryptographic chain verified."
              : "Awaiting Genesis Policy Deployment"}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  // ... Keep your existing StatCard component exactly the same ...
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl shadow-lg hover:border-slate-600 transition-all group">
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
