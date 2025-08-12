// lib/api/auth.ts
import { API_BASE_URL } from "../config";

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    // Handle validation errors or other API errors
    let errorMessage = "Registration failed";

    if (responseData.errors) {
      // Format validation errors
      errorMessage = Object.values(responseData.errors).flat().join("\n");
    } else if (responseData.message) {
      errorMessage = responseData.message;
    }

    throw new Error(errorMessage);
  }

  return responseData;
};

export const loginUser = async (data: {
  email: string;
  password: string;
  phone?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    let errorMessage = "Login failed";

    if (responseData.message) {
      errorMessage = responseData.message;
    }

    throw new Error(errorMessage);
  }

  return responseData;
};

export const logoutUser = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return await response.json();
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return await response.json();
};

export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to send reset email");
  }

  return responseData;
};

export const verifyOtp = async (email: string, otp: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "OTP verification failed");
  }

  return responseData;
};

export const resetPassword = async (
  email: string,
  otp: string,
  password: string,
  password_confirmation: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      otp,
      password,
      password_confirmation,
    }),
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || "Password reset failed");
  }

  return responseData;
};
