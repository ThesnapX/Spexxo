import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import Loading from "./components/common/Loading";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";

// Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Refund = lazy(() => import("./pages/Refund"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const AddProduct = lazy(() => import("./pages/admin/AddProduct"));
const EditProduct = lazy(() => import("./pages/admin/EditProduct"));
const ProductDetailView = lazy(() => import("./pages/admin/ProductDetailView"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const OrderDetailAdmin = lazy(() => import("./pages/admin/OrderDetailView"));
const Reviews = lazy(() => import("./pages/admin/Reviews"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Brands = lazy(() => import("./pages/admin/Brands"));
const Users = lazy(() => import("./pages/admin/Users"));
const UserDetailView = lazy(() => import("./pages/admin/UserDetailView"));
const Blogs = lazy(() => import("./pages/admin/Blogs"));
const AddBlog = lazy(() => import("./pages/admin/AddBlog"));
const EditBlog = lazy(() => import("./pages/admin/EditBlog"));
const Coupons = lazy(() => import("./pages/admin/Coupons"));
const Popups = lazy(() => import("./pages/admin/Popups"));
const EmailMarketing = lazy(() => import("./pages/admin/EmailMarketing"));

// Maintenance Mode
import MaintenanceMode from "./components/common/MaintenanceMode";

function App() {
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === "true";
  if (isMaintenance) {
    return <MaintenanceMode />;
  }
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="shop/:category" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="account/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="account/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="account/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="refund" element={<Refund />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="products/view/:id" element={<ProductDetailView />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetailAdmin />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetailView />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/add" element={<AddBlog />} />
          <Route path="blogs/edit/:id" element={<EditBlog />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="popups" element={<Popups />} />
          <Route path="email-marketing" element={<EmailMarketing />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
