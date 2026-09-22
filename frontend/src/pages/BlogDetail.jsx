// frontend/src/pages/BlogDetail.jsx

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";
import BlogArticlePreview from "../components/blog/BlogArticlePreview";
import { migrateToBlocks } from "../utils/blogBlocks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BlogDetail = () => {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/blogs/${slug}`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="pt-28 pb-16">
        <div className="container-custom text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const blog = data?.blog;
  const relatedBlogs = data?.relatedBlogs || [];
  const sidebarProducts = data?.sidebarProducts || [];

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

  const blocks = migrateToBlocks(blog.content);

  return (
    <>
      <SEO
        title={blog.seo?.metaTitle || blog.title}
        description={
          blog.seo?.metaDescription ||
          blog.excerpt ||
          (blog.content || "").replace(/<[^>]*>/g, "").substring(0, 160)
        }
        keywords={blog.seo?.metaKeywords}
        ogImage={blog.seo?.ogImage || blog.featuredImage?.url}
        ogType="article"
        canonicalUrl={`https://spexxo.vercel.app/blog/${blog.slug}`}
        blog={blog}
      />

      <div className="pt-24 md:pt-28">
        <BlogArticlePreview
          blog={blog}
          blocks={blocks}
          relatedBlogs={relatedBlogs}
          sidebarProducts={sidebarProducts}
        />
      </div>
    </>
  );
};

export default BlogDetail;
