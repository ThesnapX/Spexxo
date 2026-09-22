// frontend/src/pages/admin/AddBlog.jsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import BlogEditor from "../../components/admin/blog/BlogEditor";
import SeoScorePanel from "../../components/admin/SeoScorePanel";
import KeywordsInput from "../../components/admin/blog/KeywordsInput";
import TagsInput from "../../components/admin/blog/TagsInput";
import CategoryInput from "../../components/admin/blog/CategoryInput";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AddBlog = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [featuredFile, setFeaturedFile] = useState(null);
  const [featuredPreview, setFeaturedPreview] = useState(null);

  const [blocksRef, setBlocksRef] = useState([]);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    category: "",
    tags: [],
    author: "Spexxo Team",
    status: "draft",
    isFeatured: false,
    featuredImage: null,
    seo: { metaTitle: "", metaDescription: "", metaKeywords: "" },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["blog-categories-all"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/blogs/categories?includeInactive=true`,
      );
      return data.categories || [];
    },
  });
  const { data: tagsData } = useQuery({
    queryKey: ["blog-tags-all"],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/blogs/tags?includeInactive=true`,
      );
      return data.tags || [];
    },
  });

  const categories = categoriesData || [];
  const tags = tagsData || [];

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axios.post(`${API_URL}/blogs`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success("Blog created!");
      navigate(`/admin/blogs/view/${data.blog._id}`);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Failed to create"),
  });

  const handleChange = (field, value) => setForm({ ...form, [field]: value });
  const handleSeoChange = (field, value) =>
    setForm({ ...form, seo: { ...form.seo, [field]: value } });

  const handleFeaturedImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedFile(file);
      setFeaturedPreview(URL.createObjectURL(file));
    }
  };

  const removeFeaturedImage = () => {
    setFeaturedFile(null);
    setFeaturedPreview(null);
    setForm({ ...form, featuredImage: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (blocksRef.length === 0)
      return toast.error("Add at least one content block");

    setUploading(true);
    let featuredImage = form.featuredImage;

    if (featuredFile) {
      try {
        const fd = new FormData();
        fd.append("image", featuredFile);
        const { data } = await axios.post(`${API_URL}/upload/single`, fd, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        featuredImage = { url: data.image.url, alt: form.title };
      } catch {
        toast.error("Failed to upload featured image");
        setUploading(false);
        return;
      }
    }

    const payload = {
      ...form,
      content: JSON.stringify(blocksRef),
      featuredImage,
      category: form.category || null,
    };

    createMutation.mutate(payload);
    setUploading(false);
  };

  const seoPanelData = useMemo(
    () => ({
      title: form.title,
      excerpt: form.excerpt,
      featuredImage: form.featuredImage,
      category: form.category,
      tags: form.tags,
      seo: form.seo,
      content: JSON.stringify(blocksRef),
    }),
    [
      blocksRef,
      form.title,
      form.excerpt,
      form.featuredImage,
      form.category,
      form.tags,
      form.seo,
    ],
  );

  const blogMeta = useMemo(
    () => ({
      title: form.title,
      excerpt: form.excerpt,
      author: form.author,
      featuredImage: form.featuredImage,
      category: categories.find((c) => c._id === form.category) || null,
      tags: (form.tags || [])
        .map((tid) => tags.find((t) => t._id === tid))
        .filter(Boolean),
      status: form.status,
    }),
    [
      form.title,
      form.excerpt,
      form.author,
      form.featuredImage,
      form.category,
      form.tags,
      form.status,
      categories,
      tags,
    ],
  );

  return (
    <div>
      <button
        onClick={() => navigate("/admin/blogs")}
        className="flex items-center gap-2 text-text-light hover:text-primary transition mb-4 text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Blogs
      </button>

      <h1 className="text-2xl font-bold text-text mb-6">Add New Blog</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              placeholder="Blog title..."
            />
            <p className="text-xs text-text-light mt-1">
              {form.title.length} chars · Aim for 30-60
            </p>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium mb-1">
              Excerpt / Summary
            </label>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
              placeholder="Short summary shown in listings and search results..."
              maxLength={300}
            />
            <p className="text-xs text-text-light mt-1">
              {form.excerpt.length}/300 · Aim 100-300
            </p>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium mb-3">Content *</label>
            <BlogEditor
              value={blocksRef}
              onChange={setBlocksRef}
              blogMeta={blogMeta}
            />
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className="block text-sm font-medium mb-2">
              Featured Image
            </label>
            {featuredPreview ? (
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border">
                <img
                  src={featuredPreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 rounded-xl aspect-[16/9] flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-[#EBF4FC] transition">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
                <p className="text-sm text-text-light mt-2">
                  Click to upload featured image
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImage}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs text-text-light mt-2">
              Recommended size: <strong>1200 × 675 px</strong> (16:9). Image
              will be cropped to fit.
            </p>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-lg font-semibold text-text">SEO Settings</h2>
            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={form.seo.metaTitle}
                onChange={(e) => handleSeoChange("metaTitle", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={form.seo.metaDescription}
                onChange={(e) =>
                  handleSeoChange("metaDescription", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-primary"
                maxLength={160}
              />
              <p className="text-xs text-text-light mt-1">
                {form.seo.metaDescription.length}/160
              </p>
            </div>
            <div>
              <KeywordsInput
                label="Meta Keywords"
                value={form.seo.metaKeywords}
                onChange={(val) => handleSeoChange("metaKeywords", val)}
                placeholder="Type a keyword and press Enter or comma to add"
                hint="Separated by commas. Press Enter or comma to add a keyword."
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SeoScorePanel blogData={seoPanelData} live={true} />

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-lg font-semibold text-text">Publish</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => handleChange("author", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => handleChange("isFeatured", e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-sm">Feature on homepage</span>
            </label>

            <button
              type="submit"
              disabled={uploading || createMutation.isPending}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {uploading || createMutation.isPending
                ? "Saving..."
                : "Create Blog"}
            </button>
          </div>

          {/* ✅ Category — searchable + creatable */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <CategoryInput
              label="Category"
              selectedId={form.category}
              availableCategories={categories}
              onChange={(val) => handleChange("category", val)}
            />
          </div>

          {/* ✅ Tags — searchable + creatable + collapsible */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <TagsInput
              label="Tags"
              selectedIds={form.tags}
              availableTags={tags}
              onChange={(ids) => handleChange("tags", ids)}
              collapseThreshold={8}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddBlog;
