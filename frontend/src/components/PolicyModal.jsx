import React from "react";
import { X, FileText, Hash, User, Code, ShieldCheck } from "lucide-react";

const PolicyModal = ({ policy, isOpen, onClose }) => {
  if (!isOpen || !policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-emerald-400" />
              {policy.policyName || policy.fileName}{" "}
              <span className="text-emerald-500 font-mono text-sm">
                (v{policy.id})
              </span>
            </h2>
            <p className="text-slate-400 text-[11px] mt-1 font-mono break-all pr-4">
              <span className="text-slate-500 font-bold uppercase tracking-widest mr-2">
                SHA-256:
              </span>
              {policy.hash}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                <User size={12} /> Creator
              </p>
              <p className="text-sm font-medium text-emerald-400">
                {policy.creator}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                <ShieldCheck size={12} /> Signatures
              </p>
              <p className="text-sm font-medium text-slate-200">
                {policy.signatures?.length || 0} /{" "}
                {policy.required_signatures || 2}
              </p>
              {policy.signatures?.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {policy.signatures.map((sig) => (
                    <span
                      key={sig.admin}
                      className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono"
                    >
                      {sig.admin}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
              <FileText size={12} /> Audit Justification
            </p>
            <p className="text-sm text-slate-300 italic border-l-2 border-slate-700 pl-3">
              "{policy.justification || "No justification provided."}"
            </p>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
              <Code size={14} className="text-emerald-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Policy Payload (JSON)
              </span>
            </div>
            <pre className="p-4 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {typeof policy.rule_content === "object"
                ? JSON.stringify(policy.rule_content, null, 2)
                : policy.rule_content || "No rule logic found in payload."}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-2.5 rounded-lg font-bold text-sm transition-colors border border-slate-700"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
