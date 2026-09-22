// frontend/src/pages/admin/BlogDetailView.jsx

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import BlogBlockRenderer from "../../components/blog/BlogBlockRenderer";
import { migrateToBlocks } from "../../utils/blogBlocks";
import SeoScorePanel from "../../components/admin/SeoScorePanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FRONTEND_URL =
  import.meta.env.VITE_SITE_URL || "https://spexxo.vercel.app";

const BlogDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/blogs/admin/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return data;
    },
    enabled: !!id,
  });

  const blog = data?.blog;
  const seo = data?.seo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold">Blog not found</p>
        <button
          onClick={() => navigate("/admin/blogs")}
          className="btn-primary mt-4 text-sm"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  const blocks = migrateToBlocks(blog.content);

  return (
    <div>
      <button
        onClick={() => navigate("/admin/blogs")}
        className="flex items-center gap-2 text-text-light hover:text-primary transition mb-4 text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Blogs
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  blog.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {blog.status}
              </span>
              {blog.isFeatured && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  Featured
                </span>
              )}
              {blog.category?.name && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#EBF4FC] text-[#3D96EB]">
                  {blog.category.name}
                </span>
              )}
              <span className="text-xs text-text-light">ID: {blog.blogId}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-text mb-3">
              {blog.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-text-light flex-wrap">
              <span className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" /> {blog.author}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" /> {blog.readTime || 1} min read
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" /> {blog.views || 0} views
              </span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <a
              href={`${FRONTEND_URL}/blog/${blog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm"
            >
              View in Store
            </a>
            <button
              onClick={() => navigate(`/admin/blogs/edit/${blog._id}`)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <PencilIcon className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — preview */}
        <div className="lg:col-span-2 space-y-6">
          {blog.featuredImage?.url && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <img
                src={blog.featuredImage.url}
                alt={blog.featuredImage.alt || blog.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {blog.excerpt && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm font-medium text-blue-800 mb-1">Excerpt</p>
              <p className="text-text">{blog.excerpt}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Content Preview</h2>
            <BlogBlockRenderer blocks={blocks} isEditor={true} />
          </div>
        </div>

        {/* Right — SEO + meta */}
        <div className="space-y-6">
          <SeoScorePanel blogData={blog} serverSeo={seo} />

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-text text-sm mb-3">SEO Meta</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-text-light">Meta Title</p>
                <p className="text-text">{blog.seo?.metaTitle || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">Meta Description</p>
                <p className="text-text">{blog.seo?.metaDescription || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-light">Slug</p>
                <p className="text-text break-all">/{blog.slug}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailView;
