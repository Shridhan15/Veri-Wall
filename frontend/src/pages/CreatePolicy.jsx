import React, { useState, useEffect } from "react";
import {
  Send,
  Code,
  Hash,
  Layers,
  FileText,
  User,
  Type,
  Link as LinkIcon,
  PlusCircle,
  Edit,
} from "lucide-react";
import { policyAPI } from "../api";

const CreatePolicy = ({ adminName }) => {
  const [mode, setMode] = useState("new"); // 'new' or 'update'
  const [activePolicies, setActivePolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    version: 1,
    rule: '{\n  "allow": ["80", "443"],\n  "deny": ["22"]\n}',
    prev_hash: "00000000000000000000000000000000",
    justification: "",
  });

  // Fetch active policies for the dropdown when updating
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await policyAPI.getActivePolicies();
        setActivePolicies(res.data);
      } catch (err) {
        console.error("Failed to load active policies", err);
      }
    };
    fetchActive();
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "new") {
      setFormData({
        name: "",
        version: 1,
        rule: '{\n  "allow": ["80", "443"],\n  "deny": ["22"]\n}',
        prev_hash: "00000000000000000000000000000000",
        justification: "",
      });
    } else {
      // Clear form until they select an active policy from the dropdown
      setFormData({
        name: "",
        version: "",
        rule: "",
        prev_hash: "",
        justification: "",
      });
    }
  };

  const handleSelectActivePolicy = (policyName) => {
    const selected = activePolicies.find((p) => p.policyName === policyName);
    if (selected) {
      setFormData({
        name: selected.policyName,
        version: selected.id + 1, // Auto-increment version
        prev_hash: selected.hash, // Cryptographically link to previous version
        rule:
          typeof selected.rule === "object"
            ? JSON.stringify(selected.rule, null, 2)
            : selected.rule,
        justification: "", // Force a new justification for the update
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert("❌ Policy Name is compulsory.");
      return;
    }
    if (!formData.justification || !formData.justification.trim()) {
      alert("❌ Please provide a justification for this policy change.");
      return;
    }

    setLoading(true);
    try {
      await policyAPI.createPolicy(
        formData.name.trim(),
        formData.version,
        formData.rule,
        formData.prev_hash,
        adminName,
        formData.justification,
      );
      alert("Success: Policy drafted and hashed into the chain.");

      // Reset form on success
      handleModeChange(mode);
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || "Creation failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Draft Security Policy</h1>

        {/* --- MODE TOGGLE --- */}
        <div className="flex bg-slate-900 p-1 rounded-xl mb-8 border border-slate-800 w-fit">
          <button
            onClick={() => handleModeChange("new")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === "new"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PlusCircle size={16} /> Create Genesis Policy
          </button>
          <button
            onClick={() => handleModeChange("update")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === "update"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Edit size={16} /> Update Existing Policy
          </button>
        </div>

        {/* --- DROPDOWN FOR UPDATE MODE --- */}
        {mode === "update" && (
          <div className="flex flex-col gap-2 mb-6 bg-blue-950/20 p-5 rounded-xl border border-blue-900/50">
            <label className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1">
              <LinkIcon size={14} /> Select Active Policy to Evolve
            </label>
            <select
              className="bg-slate-900 border border-slate-700 p-3 rounded-lg text-sm outline-none focus:border-blue-500 text-white"
              value={formData.name}
              onChange={(e) => handleSelectActivePolicy(e.target.value)}
            >
              <option value="" disabled>
                -- Select a Policy --
              </option>
              {activePolicies.map((p) => (
                <option key={p.fileName} value={p.policyName}>
                  {p.policyName} (Current: v{p.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* --- DRAFTING FORM --- */}
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <Type size={14} /> Policy Name{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={mode === "update"} // Cannot rename an existing policy chain
            placeholder="e.g., core_firewall_rules"
            className={`p-3 rounded-lg text-sm font-mono transition-all outline-none ${
              mode === "update"
                ? "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white"
            }`}
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value.replace(/\s+/g, "_").toLowerCase(),
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
              <Layers size={14} /> Policy Version (System Locked)
            </label>
            <input
              type="number"
              disabled
              className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg outline-none text-slate-500 font-bold cursor-not-allowed"
              value={formData.version}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
              <Hash size={14} /> Cryptographic Chain (System Locked)
            </label>
            <input
              type="text"
              disabled
              className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg font-mono text-xs outline-none text-slate-500 cursor-not-allowed"
              value={formData.prev_hash}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
            <FileText size={14} /> Audit Justification{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Updating firewall to allow HTTPS traffic for new microservice..."
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg outline-none focus:border-emerald-500 text-sm transition-all"
            value={formData.justification}
            onChange={(e) =>
              setFormData({ ...formData, justification: e.target.value })
            }
          />
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
            <Code size={16} className="text-emerald-400" />
            <span className="text-sm font-mono text-slate-300">
              {formData.name
                ? `${formData.name}_rules.json`
                : "policy_rules.json"}
            </span>
          </div>
          <textarea
            className="w-full h-48 bg-slate-950 p-4 font-mono text-emerald-400 text-sm outline-none"
            value={formData.rule}
            onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
            placeholder="Define JSON rules here..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg text-white ${
              loading || !formData.name
                ? "bg-slate-800 cursor-not-allowed text-slate-500"
                : mode === "new"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
            }`}
          >
            <Send size={18} />{" "}
            {loading
              ? "Generating Hash..."
              : mode === "new"
                ? "Deploy Genesis Block"
                : "Deploy Update Block"}
          </button>

          <div className="flex items-center gap-2 bg-slate-900 text-slate-400 p-3 rounded-lg border border-slate-800">
            <User size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Identity: {adminName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePolicy;
