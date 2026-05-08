import SEO from "../components/common/SEO";

const Refund = () => (
  <>
    <SEO title="Refund Policy" />
    <div className="pt-28 pb-16">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold text-text mb-8">Refund Policy</h1>
        <div className="prose max-w-none text-text-light leading-relaxed space-y-4">
          <p>We want you to be completely satisfied with your purchase.</p>
          <h2>Return Window</h2>
          <p>
            You have 7 days from delivery to return unused items in original
            packaging.
          </p>
          <h2>Refund Process</h2>
          <p>
            Refunds will be processed within 7-10 business days after we receive
            the returned item.
          </p>
          <h2>Contact</h2>
          <p>
            For returns, contact us at satyapatanakar5@gmail.com or call +91
            9969538739.
          </p>
        </div>
      </div>
    </div>
  </>
);

export default Refund;
