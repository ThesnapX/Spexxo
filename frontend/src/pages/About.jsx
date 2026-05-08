import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";

const About = () => {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Spexxo - your premium eyewear destination in Mumbai."
      />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold text-text mb-8">About Spexxo</h1>

          <div className="prose max-w-none space-y-6">
            <p className="text-lg text-text-light leading-relaxed">
              Welcome to Spexxo, your premier destination for high-quality
              eyewear. We specialize in providing a wide range of eyeglasses,
              sunglasses, and contact lenses that combine style, comfort, and
              affordability.
            </p>

            <h2 className="text-2xl font-semibold text-text mt-8">Our Story</h2>
            <p className="text-text-light leading-relaxed">
              Founded with a vision to make premium eyewear accessible to
              everyone, Spexxo has grown from a small optical store to a trusted
              online eyewear destination. Located in the heart of Mumbai at IIT
              Market, Powai, we serve customers across India with our curated
              collection of eyewear from top brands.
            </p>

            <h2 className="text-2xl font-semibold text-text mt-8">
              Our Mission
            </h2>
            <p className="text-text-light leading-relaxed">
              We believe that everyone deserves to see clearly and look great.
              Our mission is to provide high-quality eyewear at affordable
              prices, with exceptional customer service and a seamless online
              shopping experience.
            </p>

            <h2 className="text-2xl font-semibold text-text mt-8">Visit Us</h2>
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="font-medium text-text">Mayur Opticals</p>
              <p className="text-text-light">
                Chaitanya Nagar, I.I.T Market, Powai
              </p>
              <p className="text-text-light">Mumbai, Maharashtra - 400076</p>
              <p className="text-text-light mt-2">📞 +91 9969538739</p>
              <p className="text-text-light">✉️ satyapatanakar5@gmail.com</p>
            </div>

            <div className="mt-8">
              <Link to="/shop" className="btn-primary">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
