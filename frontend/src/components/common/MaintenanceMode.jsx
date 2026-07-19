import { Link } from "react-router-dom";

const MaintenanceMode = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1C39] via-[#1a2d4a] to-[#0B1C39] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Spe<span className="text-[#3D96EB]">xxo</span>
          </h1>
        </div>

        {/* Animated Icon */}
        <div className="text-7xl mb-6 animate-bounce">👓</div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Something Clear is Coming
        </h2>

        {/* Subtitle */}
        <p className="text-gray-300 text-lg mb-8">
          We're polishing our lenses for a better view. Our new eyewear
          collection is launching soon!
        </p>

        {/* Countdown or Info */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Style", icon: "✨" },
            { label: "Quality", icon: "💎" },
            { label: "Affordable", icon: "💰" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-white text-sm font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <p className="text-gray-300 text-sm mb-3">Need help? Contact us:</p>
          <div className="space-y-2 text-sm">
            <a
              href="tel:+919969538739"
              className="block text-gray-300 hover:text-[#3D96EB] transition"
            >
              📞 +91 9969538739
            </a>
            <a
              href="mailto:satyapatanakar5@gmail.com"
              className="block text-gray-300 hover:text-[#3D96EB] transition"
            >
              ✉️ satyapatanakar5@gmail.com
            </a>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-4">
          {["Instagram", "Facebook", "WhatsApp"].map((social, i) => (
            <span
              key={i}
              className="text-gray-400 text-sm hover:text-white transition cursor-pointer"
            >
              {social}
            </span>
          ))}
        </div>

        <p className="text-gray-500 text-xs mt-8">
          © {new Date().getFullYear()} Spexxo. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMode;
