import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Users = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/users`);
      return data;
    },
  });

  const users = data?.users || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-sm text-text-light mt-1">
            {users.length} users registered
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  User
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Email
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Phone
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Role
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Joined
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-light">
                  Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-text-light">
                    No users registered yet
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-text">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.username && (
                            <p className="text-xs text-text-light">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-text-light">
                        <EnvelopeIcon className="w-3.5 h-3.5" /> {user.email}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-light">
                      {user.phone ? (
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="w-3.5 h-3.5" /> {user.phone}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-text-light">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-text-light">
                      {user.defaultAddress?.city
                        ? `${user.defaultAddress.city}, ${user.defaultAddress.state}`
                        : "No address"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
