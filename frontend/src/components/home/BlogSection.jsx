// frontend/src/components/home/BlogSection.jsx

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import SectionHeader from "../common/SectionHeader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BlogSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["home-blogs"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/blogs?limit=3`);
        return data.blogs || [];
      } catch {
        return [];
      }
    },
    staleTime: 15 * 60 * 1000,
  });

  const blogs = data || [];

  // ✅ Don't render the section at all if there are no blogs
  if (isLoading || blogs.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container-custom">
        <SectionHeader
          title="Eye Care Blog"
          subtitle="Tips, guides & latest trends in eyewear"
          linkTo="/blog"
          linkText="View All Posts"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Link
              key={blog._id}
              to={`/blog/${blog.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                {blog.featuredImage?.url ? (
                  <img
                    src={blog.featuredImage.url}
                    alt={blog.featuredImage.alt || blog.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📝
                  </div>
                )}
                {blog.category && (
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-xs font-medium px-3 py-1 rounded-full">
                    {blog.category.name}
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-text-light mb-2">
                  <span>
                    {new Date(
                      blog.publishedAt || blog.createdAt,
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {blog.readTime && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" /> {blog.readTime} min
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-text text-lg mb-2 line-clamp-2 group-hover:text-primary transition">
                  {blog.title}
                </h3>

                {blog.excerpt && (
                  <p className="text-sm text-text-light line-clamp-3 mb-3">
                    {blog.excerpt}
                  </p>
                )}

                <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Read More <ArrowRightIcon className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
