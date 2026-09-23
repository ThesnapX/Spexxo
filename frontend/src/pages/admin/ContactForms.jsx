// frontend/src/pages/admin/ContactForms.jsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  InboxIcon,
  EnvelopeIcon,
  PhoneIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ContactForms = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [openForm, setOpenForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-forms", search, status, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ sort });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const { data } = await axios.get(`${API_URL}/contact?${params}`);
      return data.contacts || [];
    },
    staleTime: 30 * 1000,
  });

  const contacts = data || [];
  const unreadCount = contacts.filter((c) => !c.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: async ({ id, isRead }) => {
      await axios.put(`${API_URL}/contact/${id}/read`, { isRead });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-forms"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-contact-unread-count"],
      });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/contact/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-forms"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-contact-unread-count"],
      });
      toast.success("Contact deleted!");
      setOpenForm(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const handleOpenForm = (contact) => {
    setOpenForm(contact);
    if (!contact.isRead) {
      markReadMutation.mutate({ id: contact._id, isRead: true });
    }
  };

  const handleToggleRead = (contact) => {
    markReadMutation.mutate({
      id: contact._id,
      isRead: !contact.isRead,
    });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete contact form from "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setSort("newest");
  };

  const hasFilters = search || status || sort !== "newest";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            Contact Forms
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-text-light mt-1">
            All contact form submissions from your store
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, subject, message, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <FunnelIcon className="w-4 h-4" />{" "}
            {showFilters ? "Hide" : "Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-light mb-1">
                Read Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 hover:underline mt-3"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-text-light">Loading...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <InboxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No Contact Forms
          </h3>
          <p className="text-text-light text-sm">
            {hasFilters
              ? "Try adjusting your filters"
              : "Contact form submissions will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    From
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Subject
                  </th>
                  <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Received
                  </th>
                  <th className="text-right text-xs font-semibold text-text-light uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-gray-50 transition cursor-pointer ${
                      !c.isRead ? "bg-blue-50/40 font-semibold" : ""
                    }`}
                    onClick={() => handleOpenForm(c)}
                  >
                    <td className="px-3 py-3">
                      {!c.isRead && (
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text">{c.name}</p>
                      <p className="text-xs text-text-light">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text truncate max-w-xs">
                        {c.subject}
                      </p>
                      <p className="text-xs text-text-light truncate max-w-xs">
                        {c.message}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-light">
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
                          onClick={() => handleToggleRead(c)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                          title={c.isRead ? "Mark Unread" : "Mark Read"}
                        >
                          {c.isRead ? (
                            <EnvelopeIcon className="w-4 h-4" />
                          ) : (
                            <EnvelopeOpenIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {openForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpenForm(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text">
                  {openForm.subject}
                </h2>
                <p className="text-xs text-text-light mt-1">
                  {new Date(openForm.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setOpenForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-sm text-text flex items-center gap-2">
                <strong>From:</strong> {openForm.name}
              </p>
              <p className="text-sm text-text flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-text-light" />
                <a
                  href={`mailto:${openForm.email}`}
                  className="text-primary hover:underline"
                >
                  {openForm.email}
                </a>
              </p>
              {openForm.phone && (
                <p className="text-sm text-text flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-text-light" />
                  <a
                    href={`tel:${openForm.phone}`}
                    className="text-primary hover:underline"
                  >
                    {openForm.phone}
                  </a>
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
              <p className="text-xs text-text-light mb-1">Message</p>
              <p className="text-sm text-text whitespace-pre-wrap">
                {openForm.message}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleToggleRead(openForm)}
                className="btn-outline text-sm"
              >
                Mark as {openForm.isRead ? "Unread" : "Read"}
              </button>
              <a
                href={`mailto:${openForm.email}?subject=Re: ${encodeURIComponent(
                  openForm.subject,
                )}`}
                className="btn-primary text-sm"
              >
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactForms;
