import { createAuthClient } from "better-auth/react";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // In browser, simply use relative path so Next.js rewrites it, 
    // or use full origin to be safe with better-auth
    return `${window.location.origin}/api/better-auth`;
  }
  // On server, use local proxy target
  return process.env.NEXT_PUBLIC_API_URL?.replace("/api", "/api/better-auth") || "http://127.0.0.1:4000/api/better-auth";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const { signIn, signOut, useSession } = authClient;
