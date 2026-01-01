import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppSidebar } from './AppSidebar';
import { BankProfile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bankProfiles, setBankProfiles] = useState<BankProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);


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
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet context={{ bankProfiles, selectedProfileId, refreshProfiles: fetchBankProfiles }} />
      </main>


    </div>
  );
}
