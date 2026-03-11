import React, { useState, useEffect } from "react";
import {
  Lock,
  FileCheck,
  XCircle,
  PenTool,
  ShieldCheck,
  User,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { policyAPI } from "../api";
import PolicyModal from "../components/PolicyModal";

const Policies = ({ userRole, adminName }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (policy) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyAPI.listPolicies();
      setPolicies(response.data);
    } catch (err) {
      console.error("Could not fetch policies", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (fileName) => {
    try {
      const res = await policyAPI.signPolicy(fileName, adminName);
      alert(res.data.message || "Signed successfully!");
      fetchPolicies();
    } catch (err) {
      alert("Signing failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Policy Audit Log</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review, sign, and enforce system configurations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
          <User size={16} className="text-slate-400" />
          <span className="text-xs text-slate-400 uppercase tracking-widest">
            Active Identity:
          </span>
          <span className="text-sm text-emerald-400 font-bold font-mono">
            {adminName}
          </span>
          <span className="ml-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">
            {userRole}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Policy Version</th>
              <th className="px-6 py-4">Creator</th>
              <th className="px-6 py-4 font-mono text-center">SHA-256 Hash</th>
              <th className="px-6 py-4 text-center">Signatures</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-8 text-center text-slate-500 font-mono"
                >
                  Loading governance chain...
                </td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-8 text-center text-slate-500 font-mono"
                >
                  No policies found in the draft registry.
                </td>
              </tr>
            ) : (
              policies.map((p) => {
                const isCreator = p.creator === adminName;
                const signaturesArray = Array.isArray(p.signatures)
                  ? p.signatures
                  : [];
                const hasSigned = signaturesArray.some(
                  (sig) => sig.admin === adminName,
                );

                return (
                  <tr
                    key={p.fileName}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold font-mono text-sm text-emerald-400">
                      {p.fileName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-300">
                      {p.creator || "Unknown"}
                    </td>
                    <td
                      className="px-6 py-4 font-mono text-slate-500 text-xs text-center"
                      title={p.hash}
                    >
                      {p.hash ? `${p.hash.substring(0, 12)}...` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded-md text-slate-300">
                        {p.signatures?.length || 0} /{" "}
                        {p.required_signatures || 2}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold w-fit tracking-wider ${
                          p.status === "Verified"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {p.status === "Verified" ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* 1. REVIEW BUTTON (Available to everyone) */}
                        <button
                          onClick={() => openModal(p)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-600"
                        >
                          <Eye size={14} /> Review
                        </button>

                        {/* 2. ADMIN ACTIONS (Sign / Creator Locked) */}
                        {userRole === "admin" && (
                          <>
                            {isCreator ? (
                              <span className="text-[10px] uppercase text-slate-500 font-bold px-3 py-1.5 bg-slate-950 border border-slate-800 rounded flex items-center gap-1">
                                <Lock size={12} /> Creator Cannot Sign
                              </span>
                            ) : hasSigned ? (
                              <span className="text-[10px] uppercase text-emerald-500 font-bold px-3 py-1.5 bg-emerald-950 border border-emerald-900 rounded flex items-center gap-1">
                                <CheckCircle2 size={12} /> Signed by You
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSign(p.fileName)}
                                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
                              >
                                <PenTool size={14} /> Cryptographic Sign
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Component Mount */}
      <PolicyModal
        policy={selectedPolicy}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Policies;
