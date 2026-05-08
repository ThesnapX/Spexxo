import { useState } from "react";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse our collection, add items to cart, and proceed to checkout. You can pay via Cash on Delivery.",
  },
  {
    q: "How long does delivery take?",
    a: "Orders are typically delivered within 5-7 business days across India.",
  },
  {
    q: "Can I return my glasses?",
    a: "Yes, we offer a 7-day return policy for unused items in original packaging.",
  },
  {
    q: "Do you offer warranty?",
    a: "All our frames come with a 6-month manufacturing warranty.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Currently we accept Cash on Delivery. Online payments will be added soon.",
  },
  {
    q: "How do I know my frame size?",
    a: "Check the measurements on your current glasses or visit our store for a fitting.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <SEO
        title="FAQ"
        description="Frequently asked questions about Spexxo eyewear."
      />
      <div className="pt-28 pb-16">
        <div className="container-custom max-w-3xl">
          <h1 className="text-4xl font-bold text-text text-center mb-4">FAQ</h1>
          <p className="text-text-light text-center mb-12">
            Frequently Asked Questions
          </p>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-text">{faq.q}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-text-light transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-text-light">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
