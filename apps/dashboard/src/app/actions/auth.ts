"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function loginAction(data: { email: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || "Failed to login" };
  }

  const result = await response.json();
  if (result.access_token) {
    (await cookies()).set("token", result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
  }
  return { success: true };
}

export async function signupAction(data: { email: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || "Failed to sign up" };
  }

  const result = await response.json();
  if (result.access_token) {
    (await cookies()).set("token", result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
  }
  return { success: true };
}

export async function logoutAction() {
  (await cookies()).delete("token");
  return { success: true };
}
