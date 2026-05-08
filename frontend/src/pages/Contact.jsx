import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/contact`, form);
      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Spexxo eyewear store in Mumbai."
      />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-6xl">
          <h1 className="text-4xl font-bold text-text text-center mb-4">
            Contact Us
          </h1>
          <p className="text-text-light text-center mb-12">
            Have a question? We'd love to hear from you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    rows="5"
                    value={form.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <div className="bg-gray-50 rounded-2xl p-8 mb-8">
                <h2 className="text-xl font-semibold text-text mb-6">
                  Store Information
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <MapPinIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text">Mayur Opticals</p>
                      <p className="text-text-light text-sm">
                        Chaitanya Nagar, I.I.T Market, Powai
                      </p>
                      <p className="text-text-light text-sm">
                        Mumbai, Maharashtra - 400076
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <PhoneIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <a
                        href="tel:+919969538739"
                        className="text-text-light hover:text-primary text-sm"
                      >
                        +91 9969538739
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <EnvelopeIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <a
                        href="mailto:satyapatanakar5@gmail.com"
                        className="text-text-light hover:text-primary text-sm"
                      >
                        satyapatanakar5@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Map Embed */}
              <div className="rounded-2xl overflow-hidden h-64">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.0282570261195!2d72.90613431490176!3d19.12539218706629!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c7f9c6d1d1e5%3A0x7bd756a6d2f7c1a5!2sIIT%20Market%2C%20Powai!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Store Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
