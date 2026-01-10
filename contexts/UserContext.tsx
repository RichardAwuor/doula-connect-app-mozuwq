
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, UserType, Language } from '@/types';

interface UserContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  userType: UserType | null;
  setUserType: (type: UserType | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  isEmailVerified: boolean;
  setIsEmailVerified: (verified: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

  return (
    <UserContext.Provider
      value={{
        userProfile,
        setUserProfile,
        language,
        setLanguage,
        userType,
        setUserType,
        userEmail,
        setUserEmail,
        isEmailVerified,
        setIsEmailVerified,
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
