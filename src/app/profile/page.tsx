import React from "react";

export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <img
            className="w-24 h-24 rounded-full border-2 border-blue-500"
            src="https://via.placeholder.com/150"
            alt="Profile"
          />
          <h2 className="mt-4 text-xl font-bold text-gray-800">John Doe</h2>
          <p className="text-gray-600">@johndoe</p>
          <p className="mt-2 text-center text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce vehicula dui nec justo malesuada.
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <button className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none">
            Edit Profile
          </button>
          <button className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
