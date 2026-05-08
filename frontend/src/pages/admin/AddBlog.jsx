import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Blogs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/blogs?limit=100`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_URL}/blogs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog deleted!");
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Delete this blog?")) deleteMutation.mutate(id);
  };

  const blogs = data?.blogs || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Blogs</h1>
        <button
          onClick={() => navigate("/admin/blogs/add")}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusIcon className="w-5 h-5" /> Add Blog
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-text-light">
                Blog
              </th>
              <th className="text-left p-4 text-sm font-medium text-text-light">
                Category
              </th>
              <th className="text-left p-4 text-sm font-medium text-text-light">
                Status
              </th>
              <th className="text-left p-4 text-sm font-medium text-text-light">
                Views
              </th>
              <th className="text-left p-4 text-sm font-medium text-text-light">
                Date
              </th>
              <th className="text-right p-4 text-sm font-medium text-text-light">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : blogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-text mb-1">No Blogs</h3>
                  <p className="text-text-light text-sm mb-4">
                    Start writing blog posts for SEO
                  </p>
                  <button
                    onClick={() => navigate("/admin/blogs/add")}
                    className="btn-primary text-sm"
                  >
                    Add First Blog
                  </button>
                </td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {blog.featuredImage?.url ? (
                          <img
                            src={blog.featuredImage.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {blog.title}
                        </p>
                        <p className="text-xs text-text-light">
                          by {blog.author}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-[#EBF4FC] text-[#3D96EB] px-2 py-1 rounded-full capitalize">
                      {blog.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${blog.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {blog.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-light">
                    {blog.views || 0}
                  </td>
                  <td className="p-4 text-xs text-text-light">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin/blogs/edit/${blog._id}`)
                        }
                        className="p-2 text-[#3D96EB] hover:bg-[#EBF4FC] rounded-lg transition"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Blogs;
