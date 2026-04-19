import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from "@/services/api";

export type SearchFilter = "orderId" | "sku" | "warehouse";

interface User {
  name: string;
  role: string;
  email: string;
  avatar: string;
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
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("orderId");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.getCurrentUser().then(setUser);
  }, []);

  const resetSearch = () => setSearchQuery("");

  return (
    <AppContext.Provider
      value={{ searchQuery, setSearchQuery, searchFilter, setSearchFilter, resetSearch, user }}
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
