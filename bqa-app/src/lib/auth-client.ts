import { createAuthClient } from "better-auth/react";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Determine the base URL dynamically on the client
    const isLocalhost = window.location.hostname === "localhost";
    return isLocalhost
      ? "http://localhost:4000/api/better-auth" // Local backend URL
      : "https://tahfidz-api.baitulquranalikhwan.cloud/api/better-auth"; // Replace with actual prod API if different
  }
  return process.env.NEXT_PUBLIC_API_URL?.replace("/api", "/api/better-auth") || "http://localhost:4000/api/better-auth";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const { signIn, signOut, useSession } = authClient;
