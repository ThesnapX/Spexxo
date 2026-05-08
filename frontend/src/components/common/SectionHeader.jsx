import { Link } from "react-router-dom";

const SectionHeader = ({ title, subtitle, linkTo, linkText = "See More" }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-text">{title}</h2>
        {subtitle && <p className="text-text-light text-sm mt-1">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-sm font-medium text-[#3D96EB] hover:text-[#2B7DD3] transition flex items-center gap-1"
        >
          {linkText}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
