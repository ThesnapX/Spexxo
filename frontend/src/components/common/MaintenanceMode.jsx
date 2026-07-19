import { Link } from "react-router-dom";
import {
  SparklesIcon,
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  MapPinIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const MaintenanceMode = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1C39] via-[#12223d] to-[#0B1C39] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#3D96EB]/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#3D96EB]/5 rounded-full translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#3D96EB]/3 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />

      <div className="text-center max-w-2xl relative z-10 px-4">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-[#3D96EB] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3D96EB]/30">
              <EyeIcon className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            Spe<span className="text-[#3D96EB]">xxo</span>
          </h1>
          <p className="text-gray-400 mt-3 text-lg tracking-widest uppercase">
            Premium Eyewear
          </p>
        </div>

        {/* Main Heading */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            We're Crafting Something
            <span className="block text-[#3D96EB]">Exceptional</span>
          </h2>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Our team is putting the finishing touches on a premium eyewear
            experience. From stylish frames to crystal-clear lenses, everything
            will be ready for you soon.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: SparklesIcon,
              label: "Premium Quality",
              desc: "Curated Brands",
            },
            { icon: ShieldCheckIcon, label: "Authentic", desc: "100% Genuine" },
            {
              icon: CurrencyRupeeIcon,
              label: "Best Prices",
              desc: "Great Value",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-[#3D96EB]/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-[#3D96EB]" />
              </div>
              <p className="text-white font-semibold text-sm">{item.label}</p>
              <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Launch Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ClockIcon className="w-5 h-5 text-[#3D96EB]" />
            <p className="text-white font-semibold">Launching Soon</p>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            We're excited to bring you the finest eyewear collection. Stay
            tuned!
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>👓 Eyeglasses</span>
            <span>🕶️ Sunglasses</span>
            <span>🔵 Contact Lenses</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
          <p className="text-white font-semibold mb-4">Get in Touch</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="tel:+919969538739"
              className="flex items-center gap-3 text-gray-300 hover:text-[#3D96EB] transition p-3 rounded-xl hover:bg-white/5"
            >
              <div className="w-10 h-10 bg-[#3D96EB]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <PhoneIcon className="w-5 h-5 text-[#3D96EB]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Call Us</p>
                <p className="text-sm font-medium">+91 9969538739</p>
              </div>
            </a>
            <a
              href="mailto:satyapatanakar5@gmail.com"
              className="flex items-center gap-3 text-gray-300 hover:text-[#3D96EB] transition p-3 rounded-xl hover:bg-white/5"
            >
              <div className="w-10 h-10 bg-[#3D96EB]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <EnvelopeIcon className="w-5 h-5 text-[#3D96EB]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Email Us</p>
                <p className="text-sm font-medium truncate">
                  satyapatanakar5@gmail.com
                </p>
              </div>
            </a>
            <div className="flex items-center gap-3 text-gray-300 p-3 rounded-xl">
              <div className="w-10 h-10 bg-[#3D96EB]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-5 h-5 text-[#3D96EB]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Visit Us</p>
                <p className="text-sm font-medium">IIT Market, Powai, Mumbai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} Spexxo. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMode;
