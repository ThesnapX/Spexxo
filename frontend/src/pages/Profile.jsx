import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/common/SEO";

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <SEO title="My Account" />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-4xl">
          <h1 className="text-3xl font-bold text-text mb-8">My Account</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-xl font-semibold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-text">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-text-light">{user?.email}</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  <Link
                    to="/account"
                    className="block px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/account/orders"
                    className="block px-4 py-2 text-text-light hover:bg-gray-50 rounded-lg text-sm"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/account/wishlist"
                    className="block px-4 py-2 text-text-light hover:bg-gray-50 rounded-lg text-sm"
                  >
                    Wishlist
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-text mb-6">
                  Profile Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-light mb-1">
                      First Name
                    </label>
                    <p className="font-medium text-text">{user?.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-light mb-1">
                      Last Name
                    </label>
                    <p className="font-medium text-text">{user?.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-light mb-1">
                      Email
                    </label>
                    <p className="font-medium text-text">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-text-light mb-1">
                      Phone
                    </label>
                    <p className="font-medium text-text">
                      {user?.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
