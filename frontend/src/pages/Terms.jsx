import SEO from "../components/common/SEO";

const Terms = () => (
  <>
    <SEO title="Terms & Conditions" />
    <div className="pt-28 pb-16">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold text-text mb-8">
          Terms & Conditions
        </h1>
        <div className="prose max-w-none text-text-light leading-relaxed space-y-4">
          <p>
            By using Spexxo, you agree to these terms and conditions. Please
            read them carefully.
          </p>
          <h2>Use of Site</h2>
          <p>
            You may use our site for personal, non-commercial purposes. You
            agree not to misuse or interfere with our services.
          </p>
          <h2>Orders & Payments</h2>
          <p>
            All orders are subject to availability. We reserve the right to
            cancel orders at our discretion.
          </p>
          <h2>Returns & Refunds</h2>
          <p>
            Please refer to our Refund Policy for detailed information on
            returns and refunds.
          </p>
        </div>
      </div>
    </div>
  </>
);

export default Terms;
