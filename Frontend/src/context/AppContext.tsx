import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { setCurrentUser } from "@/services/api";
import { subscribeToAuthChanges, logout as firebaseLogout } from "@/services/firebase";

export type SearchFilter = "orderId" | "sku" | "warehouse";

interface User {
  uid: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

interface AppContextValue {
  // Page-scoped search
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchFilter: SearchFilter;
  setSearchFilter: (f: SearchFilter) => void;
  resetSearch: () => void;
  // User
  user: User | null;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("orderId");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "",
          role: "user",
          avatar: firebaseUser.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const resetSearch = () => setSearchQuery("");

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchFilter,
        setSearchFilter,
        resetSearch,
        user,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
