import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage if available
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("UserData");
    return stored ? JSON.parse(stored) : null;
  });

  // Loginuser function to store user data and token in localStorage
  const loginuser = (userData, token) => {
    setUser(userData);
    localStorage.setItem("UserData", JSON.stringify(userData)); // Store user data
    localStorage.setItem("token", token); // Store token
  };

  // Logout function to remove user data and token from localStorage
  const logout = () => {
    setUser(null); // Clear user state
    localStorage.removeItem("UserData"); // Remove user data from localStorage
    localStorage.removeItem("token"); // Remove token from localStorage
  };

  return (
    <AuthContext.Provider value={{ user, loginuser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context
export const useAuth = () => useContext(AuthContext);
