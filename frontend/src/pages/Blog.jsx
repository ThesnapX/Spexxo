import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Blog = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${API_URL}/blogs?limit=9`);
        return data;
      } catch {
        return { blogs: [] };
      }
    },
  });

  const blogs = data?.blogs || [];

  return (
    <>
      <SEO
        title="Blog"
        description="Eye care tips, latest trends, and guides on eyeglasses, sunglasses, and contact lenses."
      />
      <div className="pt-28 pb-16">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-text mb-2">Eye Care Blog</h1>
          <p className="text-text-light mb-8">
            Tips, guides & latest trends in eyewear
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-56 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">📝</p>
              <h2 className="text-xl font-semibold text-text">
                No Blog Posts Yet
              </h2>
              <p className="text-text-light">
                Check back later for eye care tips and guides
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blog/${blog.slug}`}
                  className="group"
                >
                  <div className="rounded-xl overflow-hidden mb-4">
                    <img
                      src={
                        blog.featuredImage?.url ||
                        "/images/blog/placeholder.jpg"
                      }
                      alt={blog.title}
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-xs text-primary font-medium uppercase">
                    {blog.category}
                  </span>
                  <h3 className="text-xl font-semibold text-text mt-2 mb-2 group-hover:text-primary transition">
                    {blog.title}
                  </h3>
                  <p className="text-text-light text-sm line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <p className="text-xs text-text-light mt-3">
                    {new Date(
                      blog.publishedAt || blog.createdAt,
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Blog;
