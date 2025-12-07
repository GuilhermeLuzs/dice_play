import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  birthDate: string;
  type: 'infantil' | 'juvenil' | 'adulto';
}

export interface User {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  type: 'infantil' | 'juvenil' | 'adulto' | 'admin';
  profiles: Profile[];
}

interface AuthContextType {
  user: User | null;
  currentProfile: Profile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean | 'blocked';
  register: (name: string, email: string, password: string, birthDate: string) => boolean;
  logout: () => void;
  selectProfile: (profile: Profile) => void;
  addProfile: (name: string, avatar: string, birthDate: string) => boolean;
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (profileId: string) => void;
  clearCurrentProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getUserType(birthDate: string): 'infantil' | 'juvenil' | 'adulto' {
  const age = calculateAge(birthDate);
  if (age < 12) return 'infantil';
  if (age < 18) return 'juvenil';
  return 'adulto';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('diceplay_user');
    const storedProfile = localStorage.getItem('diceplay_current_profile');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedProfile) {
      setCurrentProfile(JSON.parse(storedProfile));
    }
  }, []);

  const login = (email: string, password: string): boolean | 'blocked' => {
    // Check for admin account
    if (email === 'admin@diceplay.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin',
        name: 'Administrador',
        email: 'admin@diceplay.com',
        birthDate: '1990-01-01',
        type: 'admin',
        profiles: []
      };
      setUser(adminUser);
      localStorage.setItem('diceplay_user', JSON.stringify(adminUser));
      return true;
    }

    const users = JSON.parse(localStorage.getItem('diceplay_users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      if (foundUser.blocked) {
        return 'blocked';
      }
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('diceplay_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, password: string, birthDate: string): boolean => {
    const users = JSON.parse(localStorage.getItem('diceplay_users') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      birthDate,
      type: getUserType(birthDate),
      profiles: []
    };

    users.push(newUser);
    localStorage.setItem('diceplay_users', JSON.stringify(users));
    
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('diceplay_user', JSON.stringify(userWithoutPassword));
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setCurrentProfile(null);
    localStorage.removeItem('diceplay_user');
    localStorage.removeItem('diceplay_current_profile');
  };

  const selectProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('diceplay_current_profile', JSON.stringify(profile));
  };

  const clearCurrentProfile = () => {
    setCurrentProfile(null);
    localStorage.removeItem('diceplay_current_profile');
  };

  const addProfile = (name: string, avatar: string, birthDate: string): boolean => {
    if (!user || user.profiles.length >= 5) return false;

    const newProfile: Profile = {
      id: Date.now().toString(),
      name,
      avatar,
      birthDate,
      type: getUserType(birthDate)
    };

    const updatedUser = {
      ...user,
      profiles: [...user.profiles, newProfile]
    };

    setUser(updatedUser);
    localStorage.setItem('diceplay_user', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('diceplay_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].profiles = updatedUser.profiles;
      localStorage.setItem('diceplay_users', JSON.stringify(users));
    }

    return true;
  };

  const updateProfile = (profileId: string, updates: Partial<Profile>) => {
    if (!user) return;

    const updatedProfiles = user.profiles.map(p => {
      if (p.id === profileId) {
        const updated = { ...p, ...updates };
        if (updates.birthDate) {
          updated.type = getUserType(updates.birthDate);
        }
        return updated;
      }
      return p;
    });

    const updatedUser = { ...user, profiles: updatedProfiles };
    setUser(updatedUser);
    localStorage.setItem('diceplay_user', JSON.stringify(updatedUser));

    if (currentProfile?.id === profileId) {
      const updatedProfile = updatedProfiles.find(p => p.id === profileId);
      if (updatedProfile) {
        setCurrentProfile(updatedProfile);
        localStorage.setItem('diceplay_current_profile', JSON.stringify(updatedProfile));
      }
    }

    const users = JSON.parse(localStorage.getItem('diceplay_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].profiles = updatedProfiles;
      localStorage.setItem('diceplay_users', JSON.stringify(users));
    }
  };

  const deleteProfile = (profileId: string) => {
    if (!user) return;

    const updatedProfiles = user.profiles.filter(p => p.id !== profileId);
    const updatedUser = { ...user, profiles: updatedProfiles };
    setUser(updatedUser);
    localStorage.setItem('diceplay_user', JSON.stringify(updatedUser));

    if (currentProfile?.id === profileId) {
      setCurrentProfile(null);
      localStorage.removeItem('diceplay_current_profile');
    }

    const users = JSON.parse(localStorage.getItem('diceplay_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].profiles = updatedProfiles;
      localStorage.setItem('diceplay_users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentProfile,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      selectProfile,
      addProfile,
      updateProfile,
      deleteProfile,
      clearCurrentProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
