"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const {status } = useSession();
  const router = useRouter();
  

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); // Redirect away if already logged in
    }
  }, [status, router]);

  if (status === "loading") return <p className="text-white text-center mt-10">Loading...</p>;
  if (status === "authenticated") return null; // Prevent flashing login page


  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-zinc-900 rounded-2xl shadow-lg p-10 w-full max-w-sm text-center space-y-6">
        <h1 className="text-3xl font-bold text-white">Login</h1>
        <button
          onClick={() =>
            signIn("google", {
              callbackUrl: "/", // Redirect after login
            })
          }
          className="w-full py-2 rounded bg-zinc-600 text-white hover:bg-gray-500 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}