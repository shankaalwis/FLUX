import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BankProfile } from '@/types/database';
import { AccountCard } from '@/components/bank-profile/AccountCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Accounts() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bankProfiles, setBankProfiles] = useState<BankProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddProfile, setShowAddProfile] = useState(false);
    const [newProfile, setNewProfile] = useState({ name: '', bank_name: '', account_type: 'checking' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchBankProfiles();
        }
    }, [user]);

    const fetchBankProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bank_profiles')
            .select(`
        *,
        statements:statements(count),
        transactions:transactions(count)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bank profiles:', error);
            toast.error('Failed to load bank profiles');
        } else {
            setBankProfiles(data as any);
        }
        setLoading(false);
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

        setBankProfiles([data as BankProfile, ...bankProfiles]);
        setShowAddProfile(false);
        setNewProfile({ name: '', bank_name: '', account_type: 'checking' });
        toast.success('Bank profile created!');
    };

    const handleDeleteProfile = async (id: string) => {
        const { error } = await supabase
            .from('bank_profiles')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete bank profile');
            console.error(error);
            return;
        }

        setBankProfiles(bankProfiles.filter(p => p.id !== id));
        toast.success('Bank profile deleted');
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Accounts</h1>
                    <p className="text-muted-foreground">Manage your bank accounts and profiles</p>
                </div>
                <Button onClick={() => setShowAddProfile(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                </Button>
            </div>

            {bankProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <Plus className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No bank accounts yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                        Get started by adding your first bank account to track statements and transactions.
                    </p>
                    <Button onClick={() => setShowAddProfile(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Account
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bankProfiles.map((profile) => (
                        <AccountCard
                            key={profile.id}
                            profile={profile}
                            onView={() => navigate(`/accounts/${profile.id}`)}
                            onDelete={() => handleDeleteProfile(profile.id)}
                        />
                    ))}
                </div>
            )}

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
