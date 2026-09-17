import { createAuthClient } from "better-auth/react";

const getBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && apiUrl !== "/api") {
    return apiUrl.replace(/\/api$/, "/api/better-auth");
  }
  
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/better-auth`;
  }
  return "http://127.0.0.1:4000/api/better-auth";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const { signIn, signOut, useSession } = authClient;
