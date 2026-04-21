import { LayoutDashboard, Package, Truck, TrendingUp, Sparkles, Warehouse, Boxes, ShoppingCart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard",          url: "/",          icon: LayoutDashboard },
  { title: "Orders",             url: "/orders",    icon: ShoppingCart },
  { title: "Inventory",          url: "/inventory", icon: Package },
  { title: "Shipments",          url: "/shipments", icon: Truck },
  { title: "Demand Forecast",    url: "/forecast",  icon: TrendingUp },
  { title: "AI Recommendations", url: "/ai",        icon: Sparkles },
  { title: "Warehouses",         url: "/warehouses",icon: Warehouse },
];

export function AppSidebar() {
  const location = useLocation();
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="bg-sidebar px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Boxes className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">ChainOps</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/60">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url} end
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-base",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
