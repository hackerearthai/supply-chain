import { Search, ChevronDown, LogOut, Settings, User, Boxes } from "lucide-react";
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

// Page → which filters make sense
const pageFilterMap: Record<string, SearchFilter[]> = {
  "/inventory": ["sku", "warehouse"],
  "/shipments": ["orderId", "warehouse"],
  "/warehouses": ["warehouse"],
};

export const Topbar = () => {
  const { searchQuery, setSearchQuery, searchFilter, setSearchFilter, resetSearch, user } = useApp();
  const location = useLocation();

  // Reset search whenever the route changes — search is page-scoped.
  useEffect(() => {
    resetSearch();
    const allowed = pageFilterMap[location.pathname];
    if (allowed && !allowed.includes(searchFilter)) {
      setSearchFilter(allowed[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const searchEnabled = !!pageFilterMap[location.pathname];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="md:hidden" />

      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-glow">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none text-foreground">ChainOps</p>
          <p className="text-xs text-muted-foreground">Supply Intelligence</p>
        </div>
      </div>

      {/* Smart search — center */}
      <div className="mx-auto hidden w-full max-w-2xl md:block">
        <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 border-r border-border bg-muted/60 px-3 text-sm font-medium text-foreground transition-base hover:bg-muted disabled:opacity-50" disabled={!searchEnabled}>
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
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchEnabled ? `Search by ${filterLabels[searchFilter]}…` : "Search not available on this page"}
              disabled={!searchEnabled}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger className="ml-auto flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-base hover:border-border hover:bg-muted/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-accent text-sm font-semibold text-accent-foreground">
            {user?.avatar ?? "—"}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-medium leading-none text-foreground">{user?.name ?? "Loading…"}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
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
          <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
