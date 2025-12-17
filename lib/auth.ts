"use server";

import { cookies } from "next/headers";

export async function setToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    httpOnly: false, // Made false so client can read it for API headers
    sameSite: "lax",
    path: "/",
  });

  return true;
}

export async function setUser(user: any) {
  const cookieStore = await cookies();
  
  cookieStore.set("user", JSON.stringify(user), {
    httpOnly: true, // Only accessible by server
    sameSite: "lax",
    path: "/",
  });
}

export async function getUser() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");
  
  if (!userCookie) return null;
  
  try {
    return JSON.parse(userCookie.value);
  } catch (error) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  
  // Clear token
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Clear user
  cookieStore.set("user", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}