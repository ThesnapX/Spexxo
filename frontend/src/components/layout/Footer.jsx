import { Link } from "react-router-dom";
import { useState } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      // You can create a newsletter endpoint
      toast.success("Subscribed to newsletter!");
      setEmail("");
    } catch (error) {
      toast.error("Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-text text-white">
      {/* Newsletter */}
      <div className="border-b border-gray-700">
        <div className="container-custom py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-gray-400">
                Get updates on new arrivals, offers & eye care tips.
              </p>
            </div>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex w-full md:w-auto gap-2"
            >
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary w-full md:w-80 text-white"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary whitespace-nowrap"
              >
                {loading ? "Sending..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <img
              src="/images/logo-white.png"
              alt="Spexxo"
              className="h-8 md:h-12 w-auto "
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your premium destination for eyeglasses, sunglasses, and contact
              lenses. Quality eyewear at affordable prices with free shipping.
            </p>
            <div className="flex gap-3">
              {[FaFacebook, FaInstagram, FaTwitter, FaYoutube].map(
                (Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <Icon className="text-white text-lg" />
                  </a>
                ),
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: "About Us", path: "/about" },
                { name: "Blog", path: "/blog" },
                { name: "Contact Us", path: "/contact" },
                { name: "FAQ", path: "/faq" },
                { name: "Track Order", path: "/account/orders" },
                { name: "My Account", path: "/account" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Categories</h4>
            <ul className="space-y-3">
              {[
                { name: "Men Eyeglasses", path: "/shop/eyeglasses?gender=men" },
                {
                  name: "Women Eyeglasses",
                  path: "/shop/eyeglasses?gender=women",
                },
                { name: "Men Sunglasses", path: "/shop/sunglasses?gender=men" },
                {
                  name: "Women Sunglasses",
                  path: "/shop/sunglasses?gender=women",
                },
                { name: "Contact Lenses", path: "/shop/contact-lens" },
                { name: "Blue Cut Glasses", path: "/shop?lensType=blue-cut" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary transition"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPinIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-400 text-sm">
                  Mayur Opticals, Chaitanya Nagar, I.I.T Market, Powai, Mumbai,
                  Maharashtra - 400076
                </span>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="tel:+919969538739"
                  className="text-gray-400 hover:text-primary text-sm"
                >
                  +91 9969538739
                </a>
              </li>
              <li className="flex gap-3">
                <EnvelopeIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:satyapatanakar5@gmail.com"
                  className="text-gray-400 hover:text-primary text-sm"
                >
                  satyapatanakar5@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="container-custom py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Spexxo. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { name: "Privacy Policy", path: "/privacy" },
              { name: "Terms & Conditions", path: "/terms" },
              { name: "Shipping Policy", path: "/shipping" },
              { name: "Refund Policy", path: "/refund" },
            ].map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-400 hover:text-primary text-sm transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
