import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BankProfile as BankProfileType } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ProfileOverview } from '@/components/bank-profile/ProfileOverview';
import { StatementUpload } from '@/components/bank-profile/StatementUpload';
import { SettingsTab } from '@/components/bank-profile/SettingsTab';
import { toast } from 'sonner';

export default function BankProfile() {
    const { profileId } = useParams<{ profileId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<BankProfileType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profileId) {
            fetchProfile();
        }
    }, [user, profileId]);

    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bank_profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error) {
            console.error('Error fetching bank profile:', error);
            toast.error('Failed to load bank profile');
            navigate('/accounts');
            return;
        }

        setProfile(data as BankProfileType);
        setLoading(false);
    };

    const handleProfileUpdate = (updatedProfile: BankProfileType) => {
        setProfile(updatedProfile);
    };

    const handleProfileDelete = () => {
        navigate('/accounts');
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <Link to="/accounts">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Accounts
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <p className="text-muted-foreground">{profile.bank_name} • {profile.account_type}</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="statements">Statements</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <ProfileOverview profileId={profile.id} />
                </TabsContent>

                <TabsContent value="statements" className="space-y-4">
                    <StatementUpload profileId={profile.id} />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <div className="text-center py-12 text-muted-foreground">
                        Transactions tab - Coming soon
                    </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <div className="text-center py-12 text-muted-foreground">
                        Insights tab - Coming soon
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <SettingsTab
                        profile={profile}
                        onUpdate={handleProfileUpdate}
                        onDelete={handleProfileDelete}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
