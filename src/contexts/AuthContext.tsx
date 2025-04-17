import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { loginUser, signupUser } from '../services/api';
import { User } from '../types'; // Define User type matching backend (or use Prisma types if possible)

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (details: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load token and user info on app start
    const bootstrapAsync = async () => {
      let userToken: string | null = null;
      try {
        userToken = await SecureStore.getItemAsync('authToken');
        if (userToken) {
          setToken(userToken);
          // Optionally fetch user profile here if token exists
          // const response = await api.get('/profile'); // Assuming getMyProfile is added to api service
          // setUser(response.data);
        }
      } catch (e) {
        console.error('Restoring token failed', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (credentials: any) => {
    try {
      setIsLoading(true);
      const response = await loginUser(credentials);
      const { token: newToken, user: loggedInUser } = response.data;
      setToken(newToken);
      setUser(loggedInUser);
      await SecureStore.setItemAsync('authToken', newToken);
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      // Handle login error (e.g., show message to user)
      throw error; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (details: any) => {
    try {
      setIsLoading(true);
      console.log('Signup details:', details);
      await signupUser(details);
      // Optionally log in the user directly after signup
      // await login({ email: details.email, password: details.password });
    } catch (error: any) {
      console.error('Signup failed:', error.response?.data || error.message);
      // Handle signup error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('authToken');
    // Add cleanup logic if needed (e.g., disconnect WebSocket)
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};