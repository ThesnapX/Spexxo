import {
  TruckIcon,
  GlobeAltIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: TruckIcon,
    title: "Free Delivery",
    description: "Free shipping on all orders above ₹999 across India",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: GlobeAltIcon,
    title: "Worldwide Shipping",
    description:
      "We deliver to over 50 countries with reliable courier partners",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: ClockIcon,
    title: "24/7 Support",
    description: "Round the clock customer service for all your queries",
    color: "bg-purple-50 text-purple-600",
  },
];

const FeaturesSection = () => {
  return (
    <section className="container-custom py-8 md:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 text-center hover:scale-[1.03] active:scale-[0.98]"
          >
            <div
              className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
            >
              <feature.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-text mb-1">{feature.title}</h3>
            <p className="text-text-light text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
