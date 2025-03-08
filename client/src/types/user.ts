export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  role: 'admin' | 'creator' | 'optimizer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileImageUrl?: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  fullName?: string;
  role: User['role'];
  isActive: boolean;
  projects?: number[];
}

export interface CreateUserData extends UserFormData {
  password: string;
}

export interface UpdateUserData extends Omit<UserFormData, 'password'> {
  password?: string;
}