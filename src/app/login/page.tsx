'use client'

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function Login() {
  const route=useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/user/login", formData);
      console.log("Signup successful:", response.data);

      // Redirect to login page or another page after successful signup
      route.push("/");
    } catch (err: any) {
      console.error("Signup error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-100 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 mt-1 text-gray-900 bg-gray-100 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}>
          {loading ? "  Loggining In..." : "Log In"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Don't have an account? <Link href="/signup" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
