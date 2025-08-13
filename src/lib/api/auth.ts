// lib/api/auth.ts
import { API_BASE_URL } from "../config";

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role: string;
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
    let errorMessage = "Registration failed";
    if (responseData.errors) {
      errorMessage = Object.values(responseData.errors).flat().join("\n");
    } else if (responseData.message) {
      errorMessage = responseData.message;
    }
    throw new Error(errorMessage);
  }

  // Store token after successful registration
  if (responseData.token) {
    localStorage.setItem("token", responseData.token);
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

  // Store token after successful login
  if (responseData.token) {
    localStorage.setItem("token", responseData.token);
  }

  return responseData;
};

export const logoutUser = async (): Promise<{ message: string }> => {
  const token = getToken();

  // First remove token from localStorage to prevent infinite loops
  localStorage.removeItem("token");

  // Create abort controller for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    // Debugging: Log the API URL being called
    console.log(`Attempting logout to: ${API_BASE_URL}/api/auth/logout`);

    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Debugging: Log response status
    console.log(`Logout response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(
        "Logout API warning:",
        errorData.message || `HTTP ${response.status}`
      );
      return { message: "Client-side logout completed" };
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn("Logout API warning:", error);
    return { message: "Client-side logout completed" };
  }
};

export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If unauthorized, remove invalid token
    if (response.status === 401) {
      localStorage.removeItem("token");
    }
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
