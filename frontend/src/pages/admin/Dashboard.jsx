import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-8">Dashboard</h1>
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Orders", value: "0", color: "bg-blue-500" },
          { label: "Total Products", value: "0", color: "bg-green-500" },
          { label: "Total Users", value: "0", color: "bg-purple-500" },
          { label: "Revenue", value: "₹0", color: "bg-orange-500" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-gray-100"
          >
            <p className="text-text-light text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-text mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
