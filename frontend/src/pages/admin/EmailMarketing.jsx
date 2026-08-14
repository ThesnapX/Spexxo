import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EmailMarketing = () => {
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    content: "",
    recipientType: "all",
    recipients: "",
  });
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/email/templates`);
      return data.templates || [];
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/email/campaigns`);
      return data.campaigns || [];
    },
  });

  const sendBulkMutation = useMutation({
    mutationFn: async (data) => {
      await axios.post(`${API_URL}/email/send-bulk`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.success("Emails sent successfully!");
      setShowCompose(false);
      setForm({
        name: "",
        subject: "",
        content: "",
        recipientType: "all",
        recipients: "",
      });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to send"),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.subject || !form.content) {
      toast.error("Subject and content are required");
      return;
    }
    setSending(true);
    const recipientsList =
      form.recipientType === "custom"
        ? form.recipients
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e)
        : [];
    sendBulkMutation.mutate({
      name: form.name,
      subject: form.subject,
      content: form.content,
      recipientType: form.recipientType,
      recipients: recipientsList,
    });
    setSending(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Email Marketing</h1>
          <p className="text-sm text-text-light mt-1">
            Send bulk emails to your customers
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" /> Compose Email
        </button>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Compose Email</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Campaign Name (Internal)
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="e.g. New Arrival Announcement"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                placeholder="e.g. New Eyewear Collection Just Dropped!"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Recipients
              </label>
              <select
                value={form.recipientType}
                onChange={(e) =>
                  setForm({ ...form, recipientType: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
              >
                <option value="all">All Subscribers</option>
                <option value="custom">Custom List</option>
              </select>
            </div>
            {form.recipientType === "custom" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email List (comma separated)
                </label>
                <textarea
                  value={form.recipients}
                  onChange={(e) =>
                    setForm({ ...form, recipients: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Content (HTML) *
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows="8"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-mono text-sm"
                placeholder="<h1>Hello!</h1><p>Check out our new collection...</p>"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={sending}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <PaperAirplaneIcon className="w-4 h-4" />{" "}
                {sending ? "Sending..." : "Send Emails"}
              </button>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="btn-outline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Email Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates?.length === 0 && (
            <p className="text-text-light col-span-full">No templates yet</p>
          )}
          {templates?.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <DocumentTextIcon className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <p className="text-xs text-text-light truncate mt-1">
                {template.subject}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Campaign History</h2>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Name
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Subject
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Sent
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Failed
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns?.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-light">
                    No campaigns yet
                  </td>
                </tr>
              )}
              {campaigns?.map((campaign) => (
                <tr key={campaign._id}>
                  <td className="p-4 text-sm font-medium">
                    {campaign.name || "Campaign"}
                  </td>
                  <td className="p-4 text-sm text-text-light truncate">
                    {campaign.subject}
                  </td>
                  <td className="p-4 text-sm text-green-600">
                    {campaign.sentCount}
                  </td>
                  <td className="p-4 text-sm text-red-600">
                    {campaign.failedCount}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === "sent"
                          ? "bg-green-100 text-green-700"
                          : campaign.status === "sending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-text-light">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailMarketing;
