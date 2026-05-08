import { Link } from "react-router-dom";

const Blogs = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Blogs</h1>
      <Link to="/admin/blogs/add" className="btn-primary text-sm">
        Add Blog
      </Link>
    </div>
    <p className="text-text-light">Blog management will be here</p>
  </div>
);

export default Blogs;
