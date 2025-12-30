import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from './AppSidebar';
import { BankProfile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bankProfiles, setBankProfiles] = useState<BankProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', bank_name: '', account_type: 'checking' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBankProfiles();
    }
  }, [user]);

  const fetchBankProfiles = async () => {
    const { data, error } = await supabase
      .from('bank_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching bank profiles:', error);
      return;
    }

    setBankProfiles(data as BankProfile[]);
  };

  const handleAddProfile = async () => {
    if (!newProfile.name.trim() || !newProfile.bank_name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    const { data, error } = await supabase
      .from('bank_profiles')
      .insert({
        user_id: user!.id,
        name: newProfile.name.trim(),
        bank_name: newProfile.bank_name.trim(),
        account_type: newProfile.account_type,
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      toast.error('Failed to create bank profile');
      console.error(error);
      return;
    }

    setBankProfiles([...bankProfiles, data as BankProfile]);
    setShowAddProfile(false);
    setNewProfile({ name: '', bank_name: '', account_type: 'checking' });
    toast.success('Bank profile created!');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        bankProfiles={bankProfiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={setSelectedProfileId}
        onAddProfile={() => setShowAddProfile(true)}
      />
      <main className="flex-1 overflow-auto">
        <Outlet context={{ bankProfiles, selectedProfileId, refreshProfiles: fetchBankProfiles }} />
      </main>

      <Dialog open={showAddProfile} onOpenChange={setShowAddProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>
              Create a new bank profile to organize your statements and transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Account Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g., Personal Checking"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                placeholder="e.g., Chase, Bank of America"
                value={newProfile.bank_name}
                onChange={(e) => setNewProfile({ ...newProfile, bank_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={newProfile.account_type}
                onValueChange={(value) => setNewProfile({ ...newProfile, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProfile(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProfile} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
