import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'superadmin' | 'owner' | 'cashier' | 'waiter' | 'manager';
  restaurantId?: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      
      updateUser: (userData) =>
        set((state) => ({ 
          user: state.user ? { ...state.user, ...userData } : null 
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
