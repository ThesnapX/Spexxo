// frontend/src/pages/admin/EmailMarketing.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  UsersIcon,
  EnvelopeIcon,
  BellIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import RichTextEmailEditor from "../../components/admin/RichTextEmailEditor";
import RecipientPillsInput from "../../components/admin/RecipientPillsInput";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════
const EmailMarketing = () => {
  const [activeTab, setActiveTab] = useState("compose"); // compose | templates | campaigns

  const tabs = [
    { id: "compose", label: "Compose Email", icon: PaperAirplaneIcon },
    { id: "templates", label: "Templates", icon: DocumentTextIcon },
    { id: "campaigns", label: "Campaign History", icon: ChartBarIcon },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Email Marketing</h1>
        <p className="text-sm text-text-light mt-1">
          Compose campaigns, manage templates, and track performance
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
                active
                  ? "bg-white text-primary border-t border-l border-r border-gray-200"
                  : "text-text-light hover:text-text hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "compose" && <ComposeTab />}
      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "campaigns" && <CampaignsTab />}
    </div>
  );
};

// ═══════════════════════════════════════════════
// COMPOSE TAB
// ═══════════════════════════════════════════════
const ComposeTab = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    subject: "",
    content: "",
    audienceType: "subscribers_only",
    customRecipients: [],
  });
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch audience count when audienceType changes
  const { data: audienceData, isLoading: audienceLoading } = useQuery({
    queryKey: ["audience-count", form.audienceType],
    queryFn: async () => {
      if (form.audienceType === "custom") {
        return { count: form.customRecipients.length };
      }
      const { data } = await axios.get(
        `${API_URL}/email/audience/count?audienceType=${form.audienceType}`,
      );
      return data;
    },
    enabled: form.audienceType !== "custom",
  });

  const recipientCount =
    form.audienceType === "custom"
      ? form.customRecipients.length
      : audienceData?.count || 0;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error("Subject is required");
    if (!form.content || !form.content.replace(/<[^>]*>/g, "").trim()) {
      return toast.error("Email content is required");
    }
    if (recipientCount === 0) {
      return toast.error("No recipients to send to");
    }
    if (
      !window.confirm(
        `Send this email to ${recipientCount} recipient(s)? This cannot be undone.`,
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const { data } = await axios.post(`${API_URL}/email/send-bulk`, form);
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      setForm({
        name: "",
        subject: "",
        content: "",
        audienceType: "subscribers_only",
        customRecipients: [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = async () => {
    // Simple inline selector
    const id = window.prompt(
      "Enter a template ID to load (or leave empty to skip):",
    );
    if (!id) return;
    try {
      const { data } = await axios.get(`${API_URL}/email/templates/${id}`);
      setForm((f) => ({
        ...f,
        subject: data.template.subject,
        content: data.template.content,
        name: f.name || data.template.name,
      }));
      toast.success("Template loaded");
    } catch {
      toast.error("Template not found");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Form */}
      <form onSubmit={handleSend} className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name (internal)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. New Year Sale"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email Subject *
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. 🎉 New Collection Just Dropped!"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">
                Email Content *
              </label>
              <button
                type="button"
                onClick={applyTemplate}
                className="text-xs text-primary hover:underline"
              >
                Load from Template
              </button>
            </div>
            <RichTextEmailEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
              placeholder="Write your email content here… (supports bold, headings, links, images)"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={sending || recipientCount === 0}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            {sending ? "Sending…" : `Send to ${recipientCount} recipient(s)`}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!form.content}
            className="btn-outline text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <EyeIcon className="w-4 h-4" /> Preview
          </button>
        </div>
      </form>

      {/* Right: Audience */}
      <aside className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-text text-sm mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-primary" /> Audience
          </h3>

          <div className="space-y-2">
            {[
              {
                value: "subscribers_only",
                label: "Subscribers Only",
                desc: "People who subscribed via the footer (guests + users)",
                icon: BellIcon,
              },
              {
                value: "all_users",
                label: "All Registered Users",
                desc: "Everyone with an account on your store",
                icon: UsersIcon,
              },
              {
                value: "subscribers_plus_users",
                label: "Subscribers + Users",
                desc: "Combined list, deduplicated",
                icon: EnvelopeIcon,
              },
              {
                value: "custom",
                label: "Custom List",
                desc: "Manually add specific emails",
                icon: PencilIcon,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = form.audienceType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, audienceType: opt.value })}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border-2 transition ${
                    active
                      ? "border-primary bg-[#EBF4FC]"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? "text-primary" : "text-text-light"}`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${active ? "text-primary" : "text-text"}`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-text-light mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {form.audienceType === "custom" && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-text-light mb-1">
                Custom Recipients
              </label>
              <RecipientPillsInput
                value={form.customRecipients}
                onChange={(list) =>
                  setForm({ ...form, customRecipients: list })
                }
                placeholder="Type email & press Enter…"
              />
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-light">Recipients</span>
              <span className="text-lg font-bold text-primary">
                {audienceLoading && form.audienceType !== "custom"
                  ? "…"
                  : recipientCount}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-semibold">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="bg-white rounded-lg border border-gray-100 p-6 max-w-2xl mx-auto">
                <p className="text-xs text-text-light mb-1">Subject</p>
                <p className="font-semibold text-text mb-4">
                  {form.subject || "(No subject)"}
                </p>
                <div
                  className="prose max-w-none text-sm text-text
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
                    [&_p]:my-2
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                    [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-3
                    [&_a]:text-primary [&_a]:underline
                    [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
                  "
                  dangerouslySetInnerHTML={{
                    __html: form.content || "<p>(No content)</p>",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
// TEMPLATES TAB
// ═══════════════════════════════════════════════
const TemplatesTab = () => {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    content: "",
    category: "general",
    description: "",
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/email/templates`);
      return data.templates || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_URL}/email/templates`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template created!");
      resetForm();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axios.put(`${API_URL}/email/templates/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template updated!");
      resetForm();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/email/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted!");
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      subject: "",
      content: "",
      category: "general",
      description: "",
    });
    setEditingTemplate(null);
    setShowEditor(false);
  };

  const handleEdit = (tpl) => {
    setEditingTemplate(tpl);
    setForm({
      name: tpl.name || "",
      subject: tpl.subject || "",
      content: tpl.content || "",
      category: tpl.category || "general",
      description: tpl.description || "",
    });
    setShowEditor(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.content.trim()) {
      toast.error("Name, subject and content are required");
      return;
    }
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete template "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-light">
          {templates?.length || 0} template{templates?.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => {
            resetForm();
            setShowEditor(true);
          }}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Create Template
        </button>
      </div>

      {/* Editor */}
      {showEditor && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingTemplate ? "Edit Template" : "New Template"}
            </h2>
            <button onClick={resetForm} className="text-gray-400">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Welcome Email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. welcome, promo, newsletter"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Short note about when to use this template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="Subject recipients will see"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Content *
              </label>
              <RichTextEmailEditor
                value={form.content}
                onChange={(html) => setForm({ ...form, content: html })}
                placeholder="Write the template content…"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary text-sm"
              >
                {editingTemplate ? "Update Template" : "Create Template"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-outline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-text-light">Loading…</div>
      ) : !templates || templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-text mb-1">No templates yet</h3>
          <p className="text-sm text-text-light mb-4">
            Save your go-to emails for reuse
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-primary text-sm"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">{tpl.name}</h3>
                </div>
                {tpl.category && (
                  <span className="text-[10px] bg-[#EBF4FC] text-primary px-2 py-0.5 rounded-full">
                    {tpl.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-light mb-1 truncate">
                {tpl.subject}
              </p>
              {tpl.description && (
                <p className="text-xs text-text-light mb-3 line-clamp-2">
                  {tpl.description}
                </p>
              )}
              <div className="flex justify-end gap-1 pt-3 border-t">
                <button
                  onClick={() => handleEdit(tpl)}
                  className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tpl._id, tpl.name)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
// CAMPAIGNS TAB
// ═══════════════════════════════════════════════
const CampaignsTab = () => {
  const queryClient = useQueryClient();
  const [openCampaignId, setOpenCampaignId] = useState(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/email/campaigns`);
      return data.campaigns || [];
    },
    refetchInterval: 15 * 1000, // refresh every 15s to catch in-progress sends
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/email/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.success("Campaign deleted!");
      setOpenCampaignId(null);
    },
  });

  if (openCampaignId) {
    return (
      <CampaignDetail
        id={openCampaignId}
        onBack={() => setOpenCampaignId(null)}
      />
    );
  }

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-12 text-text-light">Loading…</div>
      ) : !campaigns || campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-text mb-1">No campaigns yet</h3>
          <p className="text-sm text-text-light">
            Your sent campaigns will show up here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Campaign
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Audience
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Sent / Failed
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Date
                  </th>
                  <th className="text-right text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => {
                  const audienceLabels = {
                    subscribers_only: "Subscribers Only",
                    all_users: "All Users",
                    subscribers_plus_users: "Subscribers + Users",
                    custom: "Custom List",
                  };
                  const statusColors = {
                    draft: "bg-gray-100 text-gray-700",
                    sending: "bg-yellow-100 text-yellow-700",
                    sent: "bg-green-100 text-green-700",
                    failed: "bg-red-100 text-red-700",
                  };
                  return (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setOpenCampaignId(c._id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm text-text">
                          {c.name || "Campaign"}
                        </p>
                        <p className="text-xs text-text-light truncate max-w-xs">
                          {c.subject}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-light">
                        {audienceLabels[c.audienceType] || "—"}
                        <br />
                        <span className="text-xs">
                          {c.recipientCount || c.recipients?.length || 0}{" "}
                          recipients
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-600 font-medium">
                          {c.sentCount || 0}
                        </span>
                        {" / "}
                        <span className="text-red-600 font-medium">
                          {c.failedCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || statusColors.draft}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-light">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setOpenCampaignId(c._id)}
                            className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(`Delete campaign "${c.name}"?`)
                              )
                                deleteMutation.mutate(c._id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════
// CAMPAIGN DETAIL
// ═══════════════════════════════════════════════
const CampaignDetail = ({ id, onBack }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["email-campaign", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/email/campaigns/${id}`);
      return data.campaign;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-text-light">Loading…</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-text-light mb-4">Campaign not found</p>
        <button onClick={onBack} className="btn-outline text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const audienceLabels = {
    subscribers_only: "Subscribers Only",
    all_users: "All Users",
    subscribers_plus_users: "Subscribers + Users",
    custom: "Custom List",
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-light hover:text-primary transition text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Campaigns
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text">
              {data.name || "Campaign"}
            </h2>
            <p className="text-sm text-text-light mt-1">{data.subject}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              data.status === "sent"
                ? "bg-green-100 text-green-700"
                : data.status === "sending"
                  ? "bg-yellow-100 text-yellow-700"
                  : data.status === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
            }`}
          >
            {data.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Recipients</p>
          <p className="text-2xl font-bold text-text">
            {data.recipientCount || data.recipients?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Sent</p>
          <p className="text-2xl font-bold text-green-600">
            {data.sentCount || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Failed</p>
          <p className="text-2xl font-bold text-red-600">
            {data.failedCount || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-text-light">Audience</p>
          <p className="text-sm font-medium text-text mt-1">
            {audienceLabels[data.audienceType] || "—"}
          </p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-text mb-3">Email Content</h3>
        <div className="bg-gray-50 rounded-xl p-4">
          <div
            className="prose max-w-none text-sm text-text
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2
              [&_p]:my-2
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-3
              [&_a]:text-primary [&_a]:underline
              [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
            "
            dangerouslySetInnerHTML={{ __html: data.content || "" }}
          />
        </div>
      </div>

      {/* Errors */}
      {data.errors && data.errors.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <h3 className="font-semibold text-red-600 mb-3">
            Failed Recipients ({data.errors.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {data.errors.slice(0, 50).map((err, i) => (
              <div
                key={i}
                className="bg-red-50 border border-red-100 rounded-lg p-2 text-xs"
              >
                <span className="font-medium text-red-700">{err.email}</span>
                <span className="text-red-600 ml-2">— {err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipients */}
      {data.recipients && data.recipients.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-text mb-3">
            Recipients ({data.recipients.length})
          </h3>
          <div className="max-h-60 overflow-y-auto flex flex-wrap gap-1.5">
            {data.recipients.slice(0, 200).map((email, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-gray-100 text-text-light text-xs px-2.5 py-1 rounded-full"
              >
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                {email}
              </span>
            ))}
            {data.recipients.length > 200 && (
              <span className="text-xs text-text-light self-center">
                +{data.recipients.length - 200} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailMarketing;
