import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BlogDetail = () => {
  const { slug } = useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/blogs/${slug}`);
      return data.blog;
    },
  });

  if (isLoading) {
    return (
      <div className="pt-28 pb-16">
        <div className="container-custom text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="pt-28 pb-16">
        <div className="container-custom text-center py-20">
          <h2 className="text-2xl font-bold">Blog Not Found</h2>
          <Link
            to="/blog"
            className="text-primary hover:underline mt-4 inline-block"
          >
            View All Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={blog.title}
        description={blog.excerpt}
        ogImage={blog.featuredImage?.url}
        ogType="article"
      />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-3xl">
          <div className="mb-8">
            <span className="text-xs text-primary font-medium uppercase">
              {blog.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-text mt-2 mb-4">
              {blog.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-text-light">
              <span>{blog.author}</span>
              <span>•</span>
              <span>
                {new Date(
                  blog.publishedAt || blog.createdAt,
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span>{blog.readTime || "5"} min read</span>
            </div>
          </div>

          {blog.featuredImage?.url && (
            <img
              src={blog.featuredImage.url}
              alt={blog.title}
              className="w-full h-auto rounded-2xl mb-8"
            />
          )}

          <div
            className="prose max-w-none text-text-light leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <div className="mt-12 pt-8 border-t">
            <Link to="/blog" className="text-primary hover:underline">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
