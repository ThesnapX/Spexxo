// frontend/src/App.jsx

import { Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import Loading from "./components/common/Loading";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import { useCart } from "./context/CartContext";
import { useMetaPageView } from "./utils/useMetaPixel";
import { lazyRevalidate } from "./utils/versionCheck";

// ✅ Every lazy route uses lazyRevalidate so stale chunks recover
// silently instead of showing the ErrorBoundary fallback.
const Home = lazy(lazyRevalidate(() => import("./pages/Home")));
const Shop = lazy(lazyRevalidate(() => import("./pages/Shop")));
const ProductDetail = lazy(
  lazyRevalidate(() => import("./pages/ProductDetail")),
);
const Cart = lazy(lazyRevalidate(() => import("./pages/Cart")));
const Checkout = lazy(lazyRevalidate(() => import("./pages/Checkout")));
const Login = lazy(lazyRevalidate(() => import("./pages/Login")));
const Register = lazy(lazyRevalidate(() => import("./pages/Register")));
const ForgotPassword = lazy(
  lazyRevalidate(() => import("./pages/ForgotPassword")),
);
const ResetPassword = lazy(
  lazyRevalidate(() => import("./pages/ResetPassword")),
);
const Profile = lazy(lazyRevalidate(() => import("./pages/Profile")));
const MyOrders = lazy(lazyRevalidate(() => import("./pages/MyOrders")));
const OrderDetail = lazy(lazyRevalidate(() => import("./pages/OrderDetail")));
const Wishlist = lazy(lazyRevalidate(() => import("./pages/Wishlist")));
const Blog = lazy(lazyRevalidate(() => import("./pages/Blog")));
const BlogDetail = lazy(lazyRevalidate(() => import("./pages/BlogDetail")));
const About = lazy(lazyRevalidate(() => import("./pages/About")));
const Contact = lazy(lazyRevalidate(() => import("./pages/Contact")));
const FAQ = lazy(lazyRevalidate(() => import("./pages/FAQ")));
const Privacy = lazy(lazyRevalidate(() => import("./pages/Privacy")));
const Terms = lazy(lazyRevalidate(() => import("./pages/Terms")));
const Refund = lazy(lazyRevalidate(() => import("./pages/Refund")));
const NotFound = lazy(lazyRevalidate(() => import("./pages/NotFound")));

// Admin Pages
const Dashboard = lazy(lazyRevalidate(() => import("./pages/admin/Dashboard")));
const Products = lazy(lazyRevalidate(() => import("./pages/admin/Products")));
const AddProduct = lazy(
  lazyRevalidate(() => import("./pages/admin/AddProduct")),
);
const EditProduct = lazy(
  lazyRevalidate(() => import("./pages/admin/EditProduct")),
);
const ProductDetailView = lazy(
  lazyRevalidate(() => import("./pages/admin/ProductDetailView")),
);
const Orders = lazy(lazyRevalidate(() => import("./pages/admin/Orders")));
const OrderDetailAdmin = lazy(
  lazyRevalidate(() => import("./pages/admin/OrderDetailView")),
);
const Reviews = lazy(lazyRevalidate(() => import("./pages/admin/Reviews")));
const Categories = lazy(
  lazyRevalidate(() => import("./pages/admin/Categories")),
);
const Brands = lazy(lazyRevalidate(() => import("./pages/admin/Brands")));
const Shapes = lazy(lazyRevalidate(() => import("./pages/admin/Shapes")));
const Colors = lazy(lazyRevalidate(() => import("./pages/admin/Colors")));
const LensTypes = lazy(lazyRevalidate(() => import("./pages/admin/LensTypes")));
const FrameMaterials = lazy(
  lazyRevalidate(() => import("./pages/admin/FrameMaterials")),
);
const UserInspection = lazy(
  lazyRevalidate(() => import("./pages/admin/UserInspection")),
);
const UserDetailView = lazy(
  lazyRevalidate(() => import("./pages/admin/UserDetailView")),
);
const Subscribers = lazy(
  lazyRevalidate(() => import("./pages/admin/Subscribers")),
);
const ContactForms = lazy(
  lazyRevalidate(() => import("./pages/admin/ContactForms")),
);
const Blogs = lazy(lazyRevalidate(() => import("./pages/admin/Blogs")));
const AddBlog = lazy(lazyRevalidate(() => import("./pages/admin/AddBlog")));
const EditBlog = lazy(lazyRevalidate(() => import("./pages/admin/EditBlog")));
const Coupons = lazy(lazyRevalidate(() => import("./pages/admin/Coupons")));
const Popups = lazy(lazyRevalidate(() => import("./pages/admin/Popups")));
const EmailMarketing = lazy(
  lazyRevalidate(() => import("./pages/admin/EmailMarketing")),
);
const Shipping = lazy(lazyRevalidate(() => import("./pages/admin/Shipping")));
const BlogDetailView = lazy(
  lazyRevalidate(() => import("./pages/admin/BlogDetailView")),
);
const BlogCategories = lazy(
  lazyRevalidate(() => import("./pages/admin/BlogCategories")),
);
const BlogTags = lazy(lazyRevalidate(() => import("./pages/admin/BlogTags")));

function App() {
  useMetaPageView();
  const { refreshCartWithLatestData } = useCart();

  useEffect(() => {
    const handleProductUpdate = (event) => {
      if (event.detail?.productId) {
        refreshCartWithLatestData();
      }
    };

    window.addEventListener("product-updated", handleProductUpdate);
    return () =>
      window.removeEventListener("product-updated", handleProductUpdate);
  }, [refreshCartWithLatestData]);

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
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="shapes" element={<Shapes />} />
          <Route path="colors" element={<Colors />} />
          <Route path="lens-types" element={<LensTypes />} />
          <Route path="frame-materials" element={<FrameMaterials />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetailAdmin />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="user-inspection" element={<UserInspection />} />
          <Route path="users/:id" element={<UserDetailView />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="contact-forms" element={<ContactForms />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/view/:id" element={<BlogDetailView />} />
          <Route path="blog-categories" element={<BlogCategories />} />
          <Route path="blog-tags" element={<BlogTags />} />
          <Route path="blogs/add" element={<AddBlog />} />
          <Route path="blogs/edit/:id" element={<EditBlog />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="popups" element={<Popups />} />
          <Route path="email-marketing" element={<EmailMarketing />} />
          <Route path="shipping" element={<Shipping />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
