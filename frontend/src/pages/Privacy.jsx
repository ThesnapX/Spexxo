import SEO from "../components/common/SEO";
import { absoluteUrl } from "../config/siteUrl";

const Privacy = () => (
  <>
    <SEO
      title="Privacy Policy | Spexxo"
      description="Read Spexxo's privacy policy to understand how we collect, use, and protect your personal information."
      ogType="website"
      canonicalUrl={absoluteUrl("/privacy")}
    />
    <div className="pt-28 pb-16">
      <div className="container-custom max-w-3xl">
        <h1 className="text-4xl font-bold text-text mb-8">Privacy Policy</h1>
        <div className="prose max-w-none text-text-light leading-relaxed space-y-4">
          <p>
            This Privacy Policy describes how Spexxo ("we", "our", "us")
            collects, uses, and shares information when you use our website and
            services. By using Spexxo, you consent to the practices described
            here.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">
            Information We Collect
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Account information:</strong> first name, last name, email
              address, phone number, optional username, hashed password.
            </li>
            <li>
              <strong>Order information:</strong> products purchased, order
              history, delivery address, shipping and payment method, order
              status.
            </li>
            <li>
              <strong>Contact information:</strong> details you submit through
              our contact form or newsletter subscription.
            </li>
            <li>
              <strong>Payment information:</strong> handled by our payment
              processor (Razorpay). We do not store your full card or UPI
              credentials; we receive only a transaction reference and status.
            </li>
            <li>
              <strong>Technical and usage information:</strong> IP address,
              user-agent, pages viewed, referring URL, and similar data
              collected automatically.
            </li>
            <li>
              <strong>Marketing preferences:</strong> whether you have opted in
              to email communication and related engagement logs.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-6">
            How We Use Information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To create and manage your account.</li>
            <li>
              To process orders, arrange shipping, provide order updates, and
              handle returns and refunds.
            </li>
            <li>
              To send transactional emails (order confirmation, status updates,
              password resets, welcome messages) and, where you have opted in,
              marketing emails.
            </li>
            <li>
              To improve our website, product catalogue, and customer
              experience.
            </li>
            <li>
              To measure advertising effectiveness, in accordance with the
              section below.
            </li>
            <li>To detect, prevent, and address fraud or abuse.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-6">
            Cookies and Similar Technologies
          </h2>
          <p>
            We use cookies and similar technologies for authentication,
            security, cart/wishlist persistence, and analytics. You can control
            cookies through your browser settings, though disabling them may
            affect functionality.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">
            Advertising, Analytics, Meta Pixel and Conversions API
          </h2>
          <p>
            We use the Meta Pixel and the Meta Conversions API (CAPI) to measure
            the effectiveness of our advertising on Meta platforms and to show
            relevant ads. When you interact with our website, certain events
            (such as page view, product view, add-to-cart, initiate checkout,
            and completed purchase) may be shared with Meta.
          </p>
          <p>
            To match these events with Meta profiles, we may share identifiers
            such as a hashed version of your email address, hashed phone number,
            IP address, user-agent, and Meta browser identifiers (
            <code>_fbp</code>, <code>_fbc</code>) where available. Hashing is
            performed before the data leaves our systems. Where permissible, we
            also use server-side events (Conversions API).
          </p>
          <p>
            For more information, see Meta's Privacy Policy and the Meta
            Business Tools Terms. You can control Meta ad personalization
            through your Meta ad settings.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">
            Third-Party Service Providers
          </h2>
          <p>
            We share data with the following categories of service providers to
            operate our business:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Payment processors (Razorpay) for payment handling.</li>
            <li>Cloud hosting and database providers.</li>
            <li>
              Email delivery providers (Google SMTP) for transactional and
              marketing email.
            </li>
            <li>Media hosting (Cloudinary) for product images.</li>
            <li>Meta Platforms for advertising measurement.</li>
            <li>Google Analytics for site analytics.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text mt-6">
            Data Retention
          </h2>
          <p>
            We retain account information while your account is active and for a
            reasonable period afterwards as required to fulfil legal,
            accounting, and fraud-prevention obligations. Order records are
            retained as required by tax and commercial law. Marketing
            subscription data is retained until you unsubscribe.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">Security</h2>
          <p>
            We use industry-standard measures including encrypted transport
            (HTTPS), hashed passwords, and role-based access controls to protect
            your information. No online service can guarantee absolute security.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the right to access,
            correct, or delete your personal information, or to object to or
            restrict certain processing. You can update most of your account
            details in the "My Account" section, or contact us using the details
            below.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">
            Children's Privacy
          </h2>
          <p>
            Our services are not directed at children under 13. We do not
            knowingly collect personal information from children.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">
            Changes to This Policy
          </h2>
          <p>
            We may update this policy from time to time. The date of the latest
            revision will be reflected by the site's deployment.
          </p>

          <h2 className="text-xl font-semibold text-text mt-6">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a
              href="mailto:satyapatanakar5@gmail.com"
              className="text-primary hover:underline"
            >
              satyapatanakar5@gmail.com
            </a>{" "}
            or +91 9969538739, or write to us at Mayur Opticals, Chaitanya
            Nagar, I.I.T Market, Powai, Mumbai, Maharashtra - 400076.
          </p>
        </div>
      </div>
    </div>
  </>
);

export default Privacy;
