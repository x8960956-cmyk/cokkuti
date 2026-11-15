import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  FileSpreadsheet,
  MessageSquare,
  TrendingUp,
  Send,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Phone,
  Eye,
  Clock,
  Hash,
  Flame,
  Plus,
  Save,
  X,
} from 'lucide-react';
import {
  connectGoogleSheetsAccess,
  getInMemorySheetsToken,
} from '../firebase';

export const MODERATOR_EMAIL = 'x8960956@gmail.com';

interface ModeratorDashboardProps {
  currentUserEmail?: string;
}

function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return trimmed;
}

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  currentUserEmail,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'logins' | 'posts' | 'users'>('logins');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>({
    stats: {},
    loginEvents: [],
    users: [],
    posts: [],
    fundings: [],
    trends: [],
    categories: [],
    messages: [],
    settings: {
      spreadsheetId: '',
      spreadsheetUrl: '',
      sheetName: 'Logins',
      whatsappPhone: '',
      whatsappWebhookUrl: '',
    },
  });

  // Settings form state
  const [sheetInput, setSheetInput] = useState('');
  const [sheetName, setSheetName] = useState('Logins');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Google Sheets OAuth state (strictly in-memory token)
  const [hasSheetsToken, setHasSheetsToken] = useState<boolean>(Boolean(getInMemorySheetsToken()));
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [confirmOverwriteModal, setConfirmOverwriteModal] = useState(false);

  // Direct message modal / composer state
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [dmText, setDmText] = useState('');
  const [sendingDm, setSendingDm] = useState(false);

  const isAuthorized =
    Boolean(currentUserEmail) &&
    currentUserEmail!.toLowerCase().trim() === MODERATOR_EMAIL;

  const fetchOverview = useCallback(async () => {
    if (!isAuthorized) return;
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    try {
      const res = await fetch('/api/moderator/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load moderator overview');
      }
      setOverview(data);
      if (data.settings) {
        setSheetInput((prev) => prev || data.settings.spreadsheetUrl || data.settings.spreadsheetId || '');
        setSheetName((prev) => data.settings.sheetName || prev || 'Logins');
        setWhatsappPhone((prev) => prev || data.settings.whatsappPhone || '');
        setWhatsappWebhookUrl((prev) => prev || data.settings.whatsappWebhookUrl || '');
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch moderator overview');
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    fetchOverview();
    const timer = setInterval(fetchOverview, 5000);
    return () => clearInterval(timer);
  }, [fetchOverview]);

  if (!isAuthorized) {
    return null;
  }

  const handleSaveSettings = async (override?: Partial<any>) => {
    setSavingSettings(true);
    setError(null);
    setStatusMsg(null);
    const token = localStorage.getItem('cook_auth_token');
    const cleanId = extractSpreadsheetId(override?.spreadsheetId ?? sheetInput);
    const cleanUrl =
      override?.spreadsheetUrl ||
      (cleanId ? `https://docs.google.com/spreadsheets/d/${cleanId}/edit` : '');

    try {
      const res = await fetch('/api/moderator/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spreadsheetId: cleanId,
          spreadsheetUrl: cleanUrl,
          sheetName: override?.sheetName ?? sheetName,
          whatsappPhone: whatsappPhone.trim(),
          whatsappWebhookUrl: whatsappWebhookUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
      setOverview((prev: any) => ({ ...prev, settings: data.settings }));
      setStatusMsg('Moderator settings saved.');
    } catch (err: any) {
      setError(err.message || 'Could not save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const ensureSheetsToken = async (): Promise<string> => {
    const existing = getInMemorySheetsToken();
    if (existing) {
      setHasSheetsToken(true);
      return existing;
    }
    const fresh = await connectGoogleSheetsAccess();
    setHasSheetsToken(true);
    return fresh;
  };

  const handleConnectSheets = async () => {
    setError(null);
    setStatusMsg(null);
    try {
      await connectGoogleSheetsAccess();
      setHasSheetsToken(true);
      setStatusMsg('Google Sheets access connected for this session.');
    } catch (err: any) {
      setError(err?.message || 'Google Sheets authorization failed.');
    }
  };

  const buildSheetRows = () => {
    const header = [
      'Event ID',
      'Timestamp (ISO)',
      'Full Name',
      'Email',
      'Username',
      'Provider',
      'New Registration?',
      'Profile Completion %',
      'User ID',
    ];
    const events = [...(overview.loginEvents || [])].reverse(); // chronological order
    const rows = events.map((ev: any) => [
      ev.id || '',
      ev.isoTime || new Date(ev.timestamp || Date.now()).toISOString(),
      ev.name || '',
      ev.email || '',
      ev.username ? `@${ev.username}` : '',
      ev.provider || '',
      ev.isNewUser ? 'YES' : 'NO',
      `${ev.profileCompletionPercentage || 0}%`,
      ev.userId || '',
    ]);
    return [header, ...rows];
  };

  const handleCreateNewSheet = async () => {
    setSyncingSheets(true);
    setError(null);
    setStatusMsg(null);
    try {
      const accessToken = await ensureSheetsToken();
      const targetTabName = sheetName.trim() || 'Logins';
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title: 'COOK Platform — User Logins & Activity' },
          sheets: [{ properties: { title: targetTabName } }],
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok || !created.spreadsheetId) {
        throw new Error(created?.error?.message || 'Failed to create Google Sheet');
      }

      const newId = created.spreadsheetId;
      const newUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newId}/edit`;

      // Populate initial headers & existing login rows into newly created sheet
      const values = buildSheetRows();
      const range = `${encodeURIComponent(targetTabName)}!A1:I${values.length}`;
      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${newId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );
      if (!writeRes.ok) {
        const writeErr = await writeRes.json();
        throw new Error(writeErr?.error?.message || 'Sheet created, but failed writing initial rows.');
      }

      setSheetInput(newUrl);
      await handleSaveSettings({
        spreadsheetId: newId,
        spreadsheetUrl: newUrl,
        sheetName: targetTabName,
      });
      setStatusMsg(`Created Google Sheet & synced ${Math.max(0, values.length - 1)} login events!`);
    } catch (err: any) {
      setError(err?.message || 'Failed creating Google Sheet.');
    } finally {
      setSyncingSheets(false);
    }
  };

  const executeWriteToExistingSheet = async () => {
    setConfirmOverwriteModal(false);
    const targetId = extractSpreadsheetId(sheetInput || overview.settings?.spreadsheetId || '');
    if (!targetId) {
      setError('Please enter a Google Sheet URL or Spreadsheet ID first, or create a new sheet.');
      return;
    }

    setSyncingSheets(true);
    setError(null);
    setStatusMsg(null);
    try {
      const accessToken = await ensureSheetsToken();
      const targetTabName = sheetName.trim() || 'Logins';
      const values = buildSheetRows();
      const range = `${encodeURIComponent(targetTabName)}!A1:I${values.length}`;

      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );
      const writeData = await writeRes.json();
      if (!writeRes.ok) {
        throw new Error(
          writeData?.error?.message ||
            'Failed updating Google Sheet. Make sure the sheet tab name exists and you have edit access.'
        );
      }

      await handleSaveSettings({
        spreadsheetId: targetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
        sheetName: targetTabName,
      });
      setStatusMsg(`Saved ${Math.max(0, values.length - 1)} login rows to Google Sheet!`);
    } catch (err: any) {
      setError(err?.message || 'Google Sheets sync failed.');
    } finally {
      setSyncingSheets(false);
    }
  };

  const buildWhatsAppUrl = (text: string) => {
    const cleanDigits = whatsappPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(text);
    return cleanDigits
      ? `https://wa.me/${cleanDigits}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !dmText.trim()) return;
    setSendingDm(true);
    setError(null);
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch('/api/moderator/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedRecipient.id,
          content: dmText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }
      setStatusMsg(`Direct message delivered to ${selectedRecipient.name}.`);
      setDmText('');
      setSelectedRecipient(null);
      fetchOverview();
    } catch (err: any) {
      setError(err.message || 'Could not send message');
    } finally {
      setSendingDm(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const token = localStorage.getItem('cook_auth_token');
    try {
      const res = await fetch(`/api/moderator/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Post removed by moderator.');
        fetchOverview();
      }
    } catch (err) {
      // ignore
    }
  };

  const latestLogin = overview.loginEvents?.[0];

  return (
    <div className="w-full flex-1 min-w-0 max-w-6xl space-y-6 pb-8">
      {/* Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#13192B] to-[#0F172A] border border-indigo-500/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>PRIVATE OWNER & MODERATOR OBSERVER</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              COOK Live Operations & Third-Person Observer
            </h1>
            <p className="text-xs text-gray-400">
              Only visible to <strong className="text-gray-200">{MODERATOR_EMAIL}</strong>. Regular users only experience the public app.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Data</span>
          </button>
        </div>

        {/* Live Telemetry Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5">
          {[
            { label: 'Registered Users', value: overview.stats?.totalUsers || 0 },
            { label: 'Active Sessions', value: overview.stats?.activeSessions || 0 },
            { label: 'Login Events', value: (overview.loginEvents || []).length },
            { label: 'Live Posts', value: overview.stats?.totalPosts || 0 },
            { label: 'Connections', value: overview.stats?.totalConnections || 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0B0F19]/90 border border-gray-800 rounded-xl p-3 text-center">
              <span className="block text-lg font-extrabold text-white">{stat.value}</span>
              <span className="text-[10px] text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-[#1F293D] pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'logins', label: 'Logins, Sheets & WhatsApp', icon: FileSpreadsheet },
          { id: 'posts', label: '3rd-Person Posts & Trends', icon: Eye },
          { id: 'users', label: 'Users & Direct Message', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[#13192B] text-gray-400 hover:text-white border border-[#1F293D]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: LOGIN TRACKING + GOOGLE SHEETS + WHATSAPP */}
      {activeSubTab === 'logins' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Google Sheets Integration Card */}
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">Google Sheets Login Sync</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    hasSheetsToken
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {hasSheetsToken ? 'OAuth Active' : 'Connect Required'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Google Sheet URL or Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Sheet Tab Name</label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Logins"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {!hasSheetsToken && (
                  <button
                    type="button"
                    onClick={handleConnectSheets}
                    className="px-3.5 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
                  >
                    Connect Google Sheets
                  </button>
                )}

                <button
                  type="button"
                  disabled={syncingSheets}
                  onClick={handleCreateNewSheet}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Sheet</span>
                </button>

                <button
                  type="button"
                  disabled={syncingSheets}
                  onClick={() => setConfirmOverwriteModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{syncingSheets ? 'Syncing...' : 'Save Logins to Sheet'}</span>
                </button>

                {(overview.settings?.spreadsheetUrl || extractSpreadsheetId(sheetInput)) && (
                  <a
                    href={
                      overview.settings?.spreadsheetUrl ||
                      `https://docs.google.com/spreadsheets/d/${extractSpreadsheetId(sheetInput)}/edit`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* WhatsApp Alerts Card */}
            <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">WhatsApp Login Notifications</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Your WhatsApp Number (with country code, e.g. +15551234567)
                  </label>
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+15551234567"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Automated WhatsApp Webhook URL (Optional — Make / Zapier / Meta API bridge)
                  </label>
                  <input
                    type="url"
                    value={whatsappWebhookUrl}
                    onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                    placeholder="https://hook.example.com/whatsapp-alert"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() => handleSaveSettings()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingSettings ? 'Saving...' : 'Save WhatsApp Config'}</span>
                </button>

                {latestLogin && (
                  <a
                    href={buildWhatsAppUrl(
                      `COOK Login Alert:\nName: ${latestLogin.name}\nEmail: ${latestLogin.email}\nUsername: @${latestLogin.username}\nMethod: ${latestLogin.provider}\nTime: ${new Date(latestLogin.timestamp).toLocaleString()}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Latest Login on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Login Events History Table */}
          <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Real Login Activity Log</h3>
              <span className="text-[11px] text-gray-400">
                {(overview.loginEvents || []).length} recorded logins
              </span>
            </div>

            {(overview.loginEvents || []).length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No login events recorded since clearing fake data. Every future login will appear here automatically.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[11px]">
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Method</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 text-right">WhatsApp Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {(overview.loginEvents || []).map((ev: any) => (
                      <tr key={ev.id} className="hover:bg-white/5">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={ev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt={ev.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-white block">{ev.name}</span>
                              <span className="text-[10px] text-gray-400">@{ev.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-gray-300">{ev.email}</td>
                        <td className="py-2.5 pr-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold uppercase">
                            {ev.provider}
                          </span>
                          {ev.isNewUser && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                              NEW
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-gray-400 text-[11px]">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <a
                            href={buildWhatsAppUrl(
                              `COOK Login:\n${ev.name} (${ev.email}) signed in via ${ev.provider} at ${new Date(ev.timestamp).toLocaleString()}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-semibold transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 3RD-PERSON POSTS & TRENDS OBSERVER */}
      {activeSubTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Live Trends Column */}
          <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF5E1E]" />
              <h3 className="font-bold text-white text-sm">Real-Time Trends</h3>
            </div>
            {(overview.trends || []).length === 0 ? (
              <p className="text-xs text-gray-400">
                No trending hashtags yet. Real hashtags will rank here automatically as users post.
              </p>
            ) : (
              <div className="space-y-2">
                {(overview.trends || []).map((t: any) => (
                  <div
                    key={t.tag}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-gray-800 text-xs"
                  >
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#FF5E1E]" />
                      {t.tag.replace(/^#/, '')}
                    </span>
                    <span className="text-indigo-400 font-bold">
                      {t.count} {t.count === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Posts Stream (3rd-Person View) */}
          <div className="lg:col-span-2 bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FF5E1E]" />
                <h3 className="font-bold text-white text-sm">All Real Posts (Third-Person Stream)</h3>
              </div>
              <span className="text-xs text-gray-400">{(overview.posts || []).length} posts</span>
            </div>

            {(overview.posts || []).length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">
                No posts published on COOK yet.
              </p>
            ) : (
              <div className="space-y-3">
                {(overview.posts || []).map((post: any) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.author?.avatar}
                          alt={post.author?.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{post.author?.name}</span>
                          <span className="text-[10px] text-gray-400">
                            @{post.author?.username} • {post.timestamp}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const authorUser = (overview.users || []).find(
                              (u: any) => u.id === post.author?.id
                            );
                            if (authorUser) setSelectedRecipient(authorUser);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold transition"
                        >
                          Message Author
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          title="Remove post"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {post.title && <h4 className="text-xs font-bold text-white">{post.title}</h4>}
                    <p className="text-xs text-gray-300 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                      <span>{post.likes || 0} likes</span>
                      <span>•</span>
                      <span>{(post.comments || []).length} comments</span>
                      <span>•</span>
                      <span>{(post.tags || []).join(' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REAL USERS + DIRECT MESSAGE */}
      {activeSubTab === 'users' && (
        <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">All Registered Users</h3>
            <span className="text-xs text-gray-400">{(overview.users || []).length} accounts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(overview.users || []).map((u: any) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-[#0B0F19] border border-gray-800 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-11 h-11 rounded-full object-cover border border-indigo-500/40"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{u.name}</h4>
                      <p className="text-[11px] text-indigo-300 truncate">{u.email}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        @{u.username} • {u.role || 'Founder'} • {u.profileCompletionPercentage}% complete
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Joined {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedRecipient(u)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG BEFORE WRITING TO EXISTING GOOGLE SHEET */}
      {confirmOverwriteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#13192B] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Confirm Google Sheet Update</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This will write <strong className="text-white">{(overview.loginEvents || []).length}</strong> login records to tab{' '}
              <strong className="text-emerald-400">{sheetName || 'Logins'}</strong> of Google Sheet{' '}
              <code className="text-indigo-300 break-all">
                {extractSpreadsheetId(sheetInput || overview.settings?.spreadsheetId || '') || '(missing ID)'}
              </code>
              . Existing cells in columns A–I will be updated. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOverwriteModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeWriteToExistingSheet}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirm & Update Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT MESSAGE COMPOSER MODAL */}
      {selectedRecipient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#13192B] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedRecipient(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src={selectedRecipient.avatar}
                alt={selectedRecipient.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-white">Message {selectedRecipient.name}</h3>
                <p className="text-[11px] text-gray-400">{selectedRecipient.email}</p>
              </div>
            </div>
            <form onSubmit={handleSendDirectMessage} className="space-y-3">
              <textarea
                rows={4}
                required
                value={dmText}
                onChange={(e) => setDmText(e.target.value)}
                placeholder={`Write a direct message to ${selectedRecipient.name}...`}
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecipient(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingDm}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingDm ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
