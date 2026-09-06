// frontend/src/components/layout/Footer.jsx

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
              className="h-8 md:h-12 w-auto mb-4"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span className="hidden text-2xl font-bold text-white">
              Spe<span className="text-primary">xx</span>o
            </span>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              Your premium destination for eyeglasses, sunglasses, and contact
              lenses. Quality eyewear at affordable prices with free shipping.
            </p>
            <div className="flex gap-3">
              {[
                { icon: FaFacebook, url: "https://facebook.com/spexxo" },
                { icon: FaInstagram, url: "https://instagram.com/spexxo" },
                { icon: FaTwitter, url: "https://twitter.com/spexxo" },
                { icon: FaYoutube, url: "https://youtube.com/spexxo" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label={`Follow us on ${social.icon.name}`}
                >
                  <social.icon className="text-white text-lg" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Shop by Category</h4>
            <ul className="space-y-3">
              {[
                {
                  name: "Eyeglasses",
                  path: "/shop?productCategory=eyeglasses",
                },
                {
                  name: "Sunglasses",
                  path: "/shop?productCategory=sunglasses",
                },
                {
                  name: "Contact Lenses",
                  path: "/shop?productCategory=contactlens",
                },
                { name: "Men's Eyewear", path: "/shop?gender=men" },
                { name: "Women's Eyewear", path: "/shop?gender=women" },
                { name: "Kids Eyewear", path: "/shop?gender=kids" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary transition text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
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
                    className="text-gray-400 hover:text-primary transition text-sm"
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
              <li className="flex gap-3">
                <div className="w-5 h-5 text-primary flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Store Hours</p>
                  <p className="text-white text-sm font-medium">
                    Mon-Sat: 10:00 AM - 8:00 PM
                  </p>
                  <p className="text-gray-500 text-xs">Sunday: Closed</p>
                </div>
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
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
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
