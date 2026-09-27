// frontend/src/pages/BlogDetail.jsx

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import SEO from "../components/common/SEO";
import { absoluteUrl } from "../config/siteUrl";
import BlogArticlePreview from "../components/blog/BlogArticlePreview";
import { migrateToBlocks } from "../utils/blogBlocks";
import { buildBreadcrumbs } from "../utils/seoHelpers";
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
      <>
        <SEO
          title="Blog Post Not Found | Spexxo"
          description="The article you're looking for is no longer available. Explore our latest eyewear tips and guides."
          noIndex
          ogType="website"
        />
        <div className="pt-28 pb-16">
          <div className="container-custom text-center py-20">
            <p className="text-6xl mb-4">📝</p>
            <h2 className="text-2xl font-bold text-text mb-2">
              Blog Post Not Found
            </h2>
            <p className="text-text-light mb-6">
              This article may have been removed or the link is incorrect.
            </p>
            <Link to="/blog" className="btn-primary">
              View All Posts
            </Link>
          </div>
        </div>
      </>
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
        canonicalUrl={absoluteUrl(`/blog/${blog.slug}`)}
        blog={blog}
        breadcrumbs={buildBreadcrumbs([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          ...(blog.category?.name
            ? [
                {
                  name: blog.category.name,
                  path: `/blog?category=${blog.category.slug}`,
                },
              ]
            : []),
          { name: blog.title, path: `/blog/${blog.slug}` },
        ])}
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
