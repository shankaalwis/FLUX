import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Building2,
  PieChart,
  Settings,
  LogOut,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ModeToggle } from '@/components/mode-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTrigger,

  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { state, setOpen } = useSidebar();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Building2 },
    { name: 'Transactions', href: '/transactions', icon: CreditCard },
    { name: 'Statements', href: '/statements', icon: FileText },
    { name: 'Insights', href: '/insights', icon: PieChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border p-4 group-data-[state=collapsed]:p-2">
        <div className="flex items-center justify-between group-data-[state=collapsed]:justify-center">
          <div
            className="flex items-center gap-2 overflow-hidden cursor-default group-data-[state=collapsed]:cursor-pointer"
            onClick={() => {
              if (state === 'collapsed') {
                setOpen(true);
              }
            }}
          >
            <img src="/logo.png" alt="Flux Logo" className="w-8 h-8 rounded-lg shrink-0" />
            <span className="text-lg font-bold truncate group-data-[state=collapsed]:hidden">Flux</span>
          </div>
          <SidebarTrigger className="group-data-[state=collapsed]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 group-data-[state=collapsed]:p-2">
        <div className="flex flex-col gap-4 group-data-[state=collapsed]:gap-2">
          <div className="flex items-center gap-3 overflow-hidden group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:items-center group-data-[state=collapsed]:justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col group-data-[state=collapsed]:hidden">
              <span className="text-sm font-medium truncate">{user?.email}</span>
            </div>
            <div className="group-data-[state=collapsed]:hidden">
              <ModeToggle />
            </div>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link to="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
