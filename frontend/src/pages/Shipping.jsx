import SEO from "../components/common/SEO";

const Shipping = () => (
  <>
    <SEO title="Shipping Policy" />
    <div className="pt-28 pb-16">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold text-text mb-8">Shipping Policy</h1>
        <div className="prose max-w-none text-text-light leading-relaxed space-y-4">
          <p>We ship across India with reliable courier partners.</p>
          <h2>Shipping Charges</h2>
          <p>
            Free shipping on orders above ₹999. A flat ₹99 shipping fee applies
            to orders below ₹999.
          </p>
          <h2>Delivery Time</h2>
          <p>
            Orders are typically delivered within 5-7 business days. Remote
            locations may take longer.
          </p>
          <h2>Tracking</h2>
          <p>
            You will receive tracking information once your order is shipped.
          </p>
        </div>
      </div>
    </div>
  </>
);

export default Shipping;
