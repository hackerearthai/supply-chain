import { Search, ChevronDown, LogOut, User } from "lucide-react";
import { useApp, SearchFilter } from "@/context/AppContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const filterLabels: Record<SearchFilter, string> = {
  orderId: "Order ID",
  sku: "SKU Code",
  warehouse: "Warehouse",
};

const pageFilterMap: Record<string, SearchFilter[]> = {
  "/inventory": ["sku", "warehouse"],
  "/shipments": ["orderId", "warehouse"],
  "/warehouses": ["warehouse"],
};

export const Topbar = () => {
  const { searchQuery, setSearchQuery, searchFilter, setSearchFilter, resetSearch, user, logout } = useApp();
  const location = useLocation();

  useEffect(() => {
    resetSearch();
    const allowed = pageFilterMap[location.pathname];
    if (allowed && !allowed.includes(searchFilter)) {
      setSearchFilter(allowed[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const searchEnabled = !!pageFilterMap[location.pathname];
  const initials = (user?.name || "")
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
  const placeholderText = searchEnabled
    ? `Search by ${filterLabels[searchFilter].toLowerCase()}...`
    : "Search disabled on this page";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-8">
      <SidebarTrigger className="md:hidden" />

      <div className="mx-auto hidden w-full max-w-2xl md:block">
        <div className="flex items-stretch overflow-hidden rounded-lg border border-border bg-card transition-base focus-within:border-foreground/30">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 border-r border-border px-3 text-sm font-medium text-foreground transition-base hover:bg-muted disabled:opacity-50"
              disabled={!searchEnabled}
            >
              {filterLabels[searchFilter]}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(filterLabels) as SearchFilter[]).map((k) => (
                <DropdownMenuItem key={k} onClick={() => setSearchFilter(k)}>
                  {filterLabels[k]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholderText}
              disabled={!searchEnabled}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="ml-auto flex items-center gap-3 rounded-lg px-2 py-1.5 transition-base hover:bg-muted">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-foreground">
            {initials}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium leading-none text-foreground">{user?.name ?? "Loading..."}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{user?.role}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm">{user?.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => {
              void logout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
