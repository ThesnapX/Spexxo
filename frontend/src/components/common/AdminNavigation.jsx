import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  HomeIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

const AdminNavigation = ({
  showBack = true,
  showHome = true,
  className = "",
  backLabel = "Back",
  homePath = "/admin",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);

  // Check browser history state
  useEffect(() => {
    // Check if we can go back
    setCanGoBack(window.history.state?.idx > 0);
  }, [location]);

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      // If no history, go to parent path
      const pathSegments = location.pathname.split("/");
      pathSegments.pop();
      const parentPath = pathSegments.join("/") || "/admin";
      navigate(parentPath);
    }
  };

  const handleHome = () => {
    navigate(homePath);
  };

  // Get current path breadcrumbs
  const getBreadcrumbs = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    // Remove 'admin' from breadcrumbs if present
    const filteredSegments = segments.filter((s) => s !== "admin");

    let currentPath = "";
    const breadcrumbs = filteredSegments.map((segment, index) => {
      currentPath += `/${segment}`;
      // Format segment name
      const label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      // If it's an ID (like product ID, order ID), shorten it
      const displayLabel =
        segment.length > 8 && /^[0-9a-fA-F]+$/.test(segment)
          ? `${segment.substring(0, 8)}...`
          : label;

      return {
        label: displayLabel,
        path: currentPath,
        isLast: index === filteredSegments.length - 1,
      };
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {showBack && (
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              canGoBack
                ? "hover:bg-gray-100 text-text"
                : "hover:bg-gray-100 text-text"
            }`}
            title="Go Back"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{backLabel}</span>
          </button>
        )}

        {showHome && (
          <button
            onClick={handleHome}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-text"
            title="Go to Dashboard"
          >
            <HomeIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-light border-l pl-3">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300">/</span>}
              {crumb.isLast ? (
                <span className="font-medium text-text">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="hover:text-primary hover:underline transition"
                >
                  {crumb.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNavigation;
