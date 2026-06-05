"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Key, Plus, Trash2, Copy, CheckCircle, AlertTriangle, Eye, EyeOff, ArrowLeft, Activity } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

type ApiKey = {
  id: number;
  name: string;
  plan: string;
  scans_used: number;
  scans_limit: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
};

type NewKey = {
  api_key: string;
  name: string;
  plan: string;
  scans_limit: number;
};

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyName, setKeyName] = useState("My API Key");
  const [showForm, setShowForm] = useState(false);

  const fetchKeys = async () => {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    setCreating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName }),
    });
    const data = await res.json();
    if (data.api_key) {
      setNewKey(data);
      setShowForm(false);
      await fetchKeys();
    }
    setCreating(false);
  };

  const revokeKey = async (id: number) => {
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchKeys();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">GuardianAI</span>
            </Link>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-gray-500 text-sm">API Keys</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Dashboard
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your GuardianAI API keys. Maximum 3 keys per account.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              <Plus className="w-4 h-4" /> New key
            </button>
          )}
        </div>

        {/* New key revealed */}
        {newKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">API key created — save it now</span>
            </div>
            <p className="text-sm text-green-700 mb-4">This key will not be shown again. Copy it and store it securely.</p>
            <div className="bg-white border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 font-mono text-sm">
              <span className="text-gray-800 break-all">{newKey.api_key}</span>
              <button onClick={() => copy(newKey.api_key)}
                className="shrink-0 flex items-center gap-1.5 text-green-600 hover:text-green-700 text-xs font-medium">
                <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-green-600">
              <span>Plan: {newKey.plan}</span>
              <span>Limit: {newKey.scans_limit.toLocaleString()} scans/month</span>
            </div>
            <button onClick={() => setNewKey(null)} className="mt-4 text-xs text-green-600 underline">
              I've saved my key
            </button>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Create new API key</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Key name</label>
              <input value={keyName} onChange={e => setKeyName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
                placeholder="e.g. Production, Development..." />
            </div>
            <div className="flex gap-3">
              <button onClick={createKey} disabled={creating}
                className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                {creating ? "Creating..." : "Create key"}
              </button>
              <button onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2 hover:text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-red-600" /> Your API Keys
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No API keys yet</p>
              <button onClick={() => setShowForm(true)} className="mt-3 text-red-600 text-sm underline">
                Create your first key
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {keys.map(k => (
                <div key={k.id} className="px-6 py-5 flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${k.is_active ? "bg-green-400" : "bg-gray-300"}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{k.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{k.plan}</span>
                      {!k.is_active && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Revoked</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>gai_live_••••••••••••••••</span>
                      <span>{k.scans_used.toLocaleString()} / {k.scans_limit.toLocaleString()} scans</span>
                      <span>Created {new Date(k.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {k.last_used_at && <span>Last used {new Date(k.last_used_at).toLocaleDateString()}</span>}
                    </div>
                    {/* Usage bar */}
                    <div className="mt-2 h-1 bg-gray-100 rounded-full w-48">
                      <div className="h-1 bg-red-400 rounded-full" style={{ width: `${Math.min((k.scans_used / k.scans_limit) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  {k.is_active && (
                    <button onClick={() => revokeKey(k.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage note */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-2">How to use your API key</p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 mt-2">
            <div className="text-gray-500 mb-1">POST https://guardianai-api-6b1d.onrender.com/v1/scan/input</div>
            <div>Authorization: Bearer <span className="text-red-400">gai_live_your_key_here</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
