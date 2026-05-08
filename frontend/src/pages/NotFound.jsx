import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";

const NotFound = () => {
  return (
    <>
      <SEO title="404 - Page Not Found" />
      <div className="pt-28 pb-16">
        <div className="container-custom text-center py-20">
          <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-text mb-4">
            Page Not Found
          </h2>
          <p className="text-text-light mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/" className="btn-primary">
              Go Home
            </Link>
            <Link to="/shop" className="btn-outline">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
