"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, HelpCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { getNotificationIcon } from "@/lib/services/notification.service";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileSidebar } from "./sidebar";
import { CommandMenu } from "./command-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [showCommandMenu, setShowCommandMenu] = React.useState(false);
  const router = useRouter();
  const { logout, businessName } = useAuthStore();
  const { notifications, unreadCount, isLoading } = useNotifications();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Keyboard shortcut for command menu
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandMenu((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6",
          className
        )}
      >
        {/* Mobile Menu */}
        <MobileSidebar />

        {/* Business Name & Search */}
        <div className="flex-1 flex items-center gap-4">
          {businessName && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border">
              <span className="text-sm font-medium text-foreground">{businessName}</span>
            </div>
          )}
          <Button
            variant="outline"
            className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground"
            onClick={() => setShowCommandMenu(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline-flex">Search...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/help")}
            className="hidden sm:flex"
            title="Help & Support"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <DropdownMenuItem disabled className="flex items-center justify-center p-4">
                  <span className="text-sm text-muted-foreground">Loading notifications...</span>
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem disabled className="flex items-center justify-center p-4">
                  <span className="text-sm text-muted-foreground">No notifications</span>
                </DropdownMenuItem>
              ) : (
                <>
                  {notifications.slice(0, 10).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.link) {
                          router.push(notification.link);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <span className="text-base mt-0.5">{getNotificationIcon(notification)}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block">{notification.title}</span>
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {notification.message}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {format(notification.timestamp, 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-center text-primary cursor-pointer"
                onClick={(e) => { e.stopPropagation(); router.push('/dashboard'); }}
              >
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Business Owner</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    owner@business.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); router.push('/profile'); }}
                className="cursor-pointer"
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); router.push('/settings'); }}
                className="cursor-pointer"
              >
                Business Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); router.push('/help'); }}
                className="cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="text-destructive cursor-pointer"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Menu */}
      <CommandMenu open={showCommandMenu} onOpenChange={setShowCommandMenu} />
    </>
  );
}
