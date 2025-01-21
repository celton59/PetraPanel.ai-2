import { create } from 'zustand';
import { Profile, CreateUserDTO, UpdateUserDTO } from '@/types/user';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface UserState {
  users: Profile[];
  isLoading: boolean;
  error: string | null;
  createUser: (user: CreateUserDTO) => Promise<void>;
  updateUser: (id: number, user: UpdateUserDTO) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching users');
      }
      const result: ApiResponse<Profile[]> = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error fetching users');
      }
      set({ users: result.data || [], isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  createUser: async (userData: CreateUserDTO) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating user');
      }

      const result: ApiResponse<Profile> = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error creating user');
      }

      set(state => ({
        users: [...state.users, result.data],
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  updateUser: async (id: number, userData: UpdateUserDTO) => {
    set({ isLoading: true, error: null });
    try {
      const normalizedUserData = {
        ...userData,
        projectIds: userData.projectIds?.map(id => Number(id))
      };

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedUserData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating user');
      }

      const result: ApiResponse<Profile> = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error updating user');
      }

      set(state => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, ...result.data } : user
        ),
        isLoading: false
      }));

      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting user');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Error deleting user');
      }

      set(state => ({
        users: state.users.filter(user => user.id !== id),
        isLoading: false
      }));

      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoading: false 
      });
      throw error;
    }
  },
}));