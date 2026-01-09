
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, UserType, Language } from '@/types';

interface UserContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
  selectedUserType: UserType | null;
  setSelectedUserType: (type: UserType | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        setUserProfile,
        selectedLanguage,
        setSelectedLanguage,
        selectedUserType,
        setSelectedUserType,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
