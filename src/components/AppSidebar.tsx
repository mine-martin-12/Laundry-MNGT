import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShirtIcon,
  Receipt,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTheme } from "next-themes";

export function AppSidebar() {
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const [businessName, setBusinessName] =
    useState<string>("Business Hub");

  const currentPath = location.pathname;

  const { theme, setTheme } = useTheme();

  // Filter navigation items based on user role
  const navigationItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Services",
      url: "/services",
      icon: ShirtIcon,
    },
    ...(userProfile?.role === 'admin' ? [
      {
        title: "Expenses",
        url: "/expenses",
        icon: Receipt,
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
      },
    ] : [])
  ];

  // Fetch business name
  useEffect(() => {
    const fetchBusinessName = async () => {
      if (userProfile?.business_id) {
        try {
          const { data, error } = await supabase
            .from("businesses")
            .select("name")
            .eq("id", userProfile.business_id)
            .single();

          if (data && !error) {
            setBusinessName(data.name);
          }
        } catch (error) {
          console.error("Error fetching business name:", error);
        }
      }
    };

    fetchBusinessName();
  }, [userProfile?.business_id]);

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  // Simplified since we no longer have sub-items

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <ShirtIcon className="h-7 w-7 text-primary-foreground" />
          </div>
          {open && (
            <div className="flex flex-col">
              <h2 className="font-semibold text-sidebar-foreground">
                {businessName}
              </h2>
              <p className="text-xs text-sidebar-foreground/60 ">
                Management System
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="text-lg md:text-base">
                      <item.icon className="h-6 w-6 md:h-5 md:w-5" />
                      <span className="text-lg md:text-base font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          {open && (
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(userProfile?.first_name, userProfile?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg md:text-base font-medium text-sidebar-foreground truncate">
                  {userProfile?.first_name && userProfile?.last_name
                    ? `${userProfile.first_name} ${userProfile.last_name}`
                    : user?.email}
                </p>
                <p className="text-base md:text-sm text-sidebar-foreground/60 capitalize">
                  {userProfile?.role || "User"}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <NavLink to="/settings">
                <Settings className="h-6 w-6 md:h-5 md:w-5" />
                {open && <span className="ml-2 text-lg md:text-base">Settings</span>}
              </NavLink>
            </Button>

            <div
              className="flex items-center cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 px-3 rounded-md justify-start"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <div className="flex items-center justify-center w-4 h-4">
                <ThemeToggle />
              </div>
              {open && (
                <span className="ml-2 text-lg md:text-base text-sidebar-foreground">
                  Theme
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-6 w-6 md:h-5 md:w-5" />
              {open && <span className="ml-2 text-lg md:text-base">Sign Out</span>}
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
