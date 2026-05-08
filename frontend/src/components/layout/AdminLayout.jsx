import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TagIcon,
  UsersIcon,
  DocumentTextIcon,
  TicketIcon,
  PhotoIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [blogsMenuOpen, setBlogsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const menuItems = [
    { name: "Dashboard", icon: HomeIcon, path: "/admin" },
    { name: "Orders", icon: ShoppingCartIcon, path: "/admin/orders" },
    { name: "Categories", icon: TagIcon, path: "/admin/categories" },
    { name: "Brands", icon: CubeIcon, path: "/admin/brands" },
    { name: "Users", icon: UsersIcon, path: "/admin/users" },
    { name: "Coupons", icon: TicketIcon, path: "/admin/coupons" },
    { name: "Popups", icon: PhotoIcon, path: "/admin/popups" },
  ];

  const activeClass = "bg-[#EBF4FC] text-[#3D96EB] font-medium";
  const inactiveClass = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
  const dropdownActiveClass = "text-[#3D96EB] bg-[#EBF4FC] font-medium";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600"
        >
          {sidebarOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
        <Link to="/admin" className="text-xl font-bold">
          Spe<span className="text-[#3D96EB]">xxo</span> Admin
        </Link>
        <div className="w-6"></div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b flex-shrink-0">
              <Link to="/admin" className="text-2xl font-bold">
                Spe<span className="text-[#3D96EB]">xxo</span>
              </Link>
              <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {/* Dashboard */}
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === "/admin" ||
                  location.pathname === "/admin/"
                    ? activeClass
                    : inactiveClass
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              {/* Other Menu Items */}
              {menuItems.slice(1).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path) ? activeClass : inactiveClass
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Products Dropdown */}
              <div>
                <button
                  onClick={() => setProductsMenuOpen(!productsMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive("/admin/products") ? activeClass : inactiveClass
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBagIcon className="w-5 h-5" />
                    <span>Products</span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${
                      productsMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {productsMenuOpen && (
                  <div className="ml-9 mt-1 space-y-1 border-l-2 border-[#EBF4FC] pl-3">
                    <Link
                      to="/admin/products"
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === "/admin/products"
                          ? dropdownActiveClass
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      All Products
                    </Link>
                    <Link
                      to="/admin/products/add"
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === "/admin/products/add"
                          ? dropdownActiveClass
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Add Product
                    </Link>
                  </div>
                )}
              </div>

              {/* Blogs Dropdown */}
              <div>
                <button
                  onClick={() => setBlogsMenuOpen(!blogsMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive("/admin/blogs") ? activeClass : inactiveClass
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>Blogs</span>
                  </div>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${
                      blogsMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {blogsMenuOpen && (
                  <div className="ml-9 mt-1 space-y-1 border-l-2 border-[#EBF4FC] pl-3">
                    <Link
                      to="/admin/blogs"
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === "/admin/blogs"
                          ? dropdownActiveClass
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      All Blogs
                    </Link>
                    <Link
                      to="/admin/blogs/add"
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === "/admin/blogs/add"
                          ? dropdownActiveClass
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Add Blog
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* User Info - Sticky at Bottom */}
            <div className="flex-shrink-0 p-4 border-t bg-white sticky bottom-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#3D96EB] text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
              <Link
                to="/"
                className="flex items-center gap-2 w-full px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm mt-1"
              >
                <HomeIcon className="w-5 h-5" />
                View Store
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
