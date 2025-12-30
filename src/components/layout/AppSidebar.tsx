import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Building2,
  Lightbulb,
  Upload,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { BankProfile } from '@/types/database';
import { ModeToggle } from '@/components/mode-toggle';

interface AppSidebarProps {
  bankProfiles: BankProfile[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string | null) => void;
  onAddProfile: () => void;
}

export function AppSidebar({
  bankProfiles,
  selectedProfileId,
  onSelectProfile,
  onAddProfile
}: AppSidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [banksOpen, setBanksOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: Building2 },
    { name: 'Transactions', href: '/transactions', icon: CreditCard },
    { name: 'Statements', href: '/statements', icon: FileText },
    { name: 'Insights', href: '/insights', icon: Lightbulb },
    { name: 'Upload', href: '/upload', icon: Upload },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">MoneMap</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Bank Profiles */}
        <div className="mt-6">
          <Collapsible open={banksOpen} onOpenChange={setBanksOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">Bank Accounts</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  banksOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              <Button
                variant={selectedProfileId === null ? 'secondary' : 'ghost'}
                className="w-full justify-start pl-9 text-sm"
                onClick={() => onSelectProfile(null)}
              >
                All Accounts
              </Button>
              {bankProfiles.map((profile) => (
                <Button
                  key={profile.id}
                  variant={selectedProfileId === profile.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start pl-9 text-sm"
                  onClick={() => onSelectProfile(profile.id)}
                >
                  <div className="flex flex-col items-start">
                    <span>{profile.name}</span>
                    <span className="text-xs text-muted-foreground">{profile.bank_name}</span>
                  </div>
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start pl-9 text-sm text-muted-foreground"
                onClick={onAddProfile}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
          </div>
          <ModeToggle />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
