import { useState } from 'react';
import { BankProfile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Save, Trash2 } from 'lucide-react';

interface SettingsTabProps {
    profile: BankProfile;
    onUpdate: (profile: BankProfile) => void;
    onDelete: () => void;
}

export function SettingsTab({ profile, onUpdate, onDelete }: SettingsTabProps) {
    const [formData, setFormData] = useState({
        name: profile.name,
        bank_name: profile.bank_name,
        account_type: profile.account_type,
        parser_type: profile.parser_type || 'generic',
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.bank_name.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSaving(true);
        const { data, error } = await supabase
            .from('bank_profiles')
            .update({
                name: formData.name.trim(),
                bank_name: formData.bank_name.trim(),
                account_type: formData.account_type,
                parser_type: formData.parser_type,
            })
            .eq('id', profile.id)
            .select()
            .single();

        setSaving(false);

        if (error) {
            toast.error('Failed to update bank profile');
            console.error(error);
            return;
        }

        onUpdate(data as BankProfile);
        toast.success('Bank profile updated!');
    };

    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase
            .from('bank_profiles')
            .delete()
            .eq('id', profile.id);

        setDeleting(false);

        if (error) {
            toast.error('Failed to delete bank profile');
            console.error(error);
            return;
        }

        toast.success('Bank profile deleted');
        onDelete();
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Update your bank account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Account Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Personal Checking"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                            id="bank_name"
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            placeholder="e.g., Chase, Bank of America"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_type">Account Type</Label>
                        <Select
                            value={formData.account_type}
                            onValueChange={(value) => setFormData({ ...formData, account_type: value })}
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

                    <div className="space-y-2">
                        <Label htmlFor="parser_type">Parser Type</Label>
                        <Select
                            value={formData.parser_type}
                            onValueChange={(value) => setFormData({ ...formData, parser_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="generic">Generic</SelectItem>
                                <SelectItem value="chase">Chase</SelectItem>
                                <SelectItem value="bofa">Bank of America</SelectItem>
                                <SelectItem value="wells">Wells Fargo</SelectItem>
                                <SelectItem value="citi">Citibank</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Select the parser that matches your bank's statement format
                        </p>
                    </div>

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for this bank profile</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={deleting}>
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete Bank Profile
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete "{profile.name}" and all associated statements and transactions.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete Permanently
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
