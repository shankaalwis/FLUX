
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const seedData = async (userId: string) => {
    try {
        console.log('Starting seed...');
        toast.info('Starting to seed data...');

        // 1. Create Bank Profiles
        const profiles = [
            {
                user_id: userId,
                name: 'HNB Primary',
                bank_name: 'Hatton National Bank',
                account_type: 'checking',
                parser_type: 'hnb_checking',
            },
            {
                user_id: userId,
                name: 'ComBank Savings',
                bank_name: 'Commercial Bank',
                account_type: 'savings',
                parser_type: 'combank_savings',
            }
        ];

        const { data: createdProfiles, error: profileError } = await supabase
            .from('bank_profiles')
            .insert(profiles)
            .select();

        if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
        }

        const hnbId = createdProfiles.find(p => p.name === 'HNB Primary')?.id;
        const comId = createdProfiles.find(p => p.name === 'ComBank Savings')?.id;

        if (!hnbId || !comId) throw new Error('Failed to create profiles');

        // 2. Generate Transactions
        const transactions = [];
        const today = new Date();

        // Helper to random date in last 60 days
        const randomDate = (start: Date, end: Date) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
        };

        const startDate = new Date();
        startDate.setDate(today.getDate() - 60);

        // HNB Transactions (Checking - Active)
        // Income
        transactions.push({
            user_id: userId,
            bank_profile_id: hnbId,
            transaction_hash: crypto.randomUUID(),
            transaction_date: new Date(today.getFullYear(), today.getMonth(), 25).toISOString(), // Salary
            description: 'SALARY CREDIT - ABC CORP',
            original_description: 'SALARY CREDIT - ABC CORP',
            amount: 250000,
            transaction_type: 'credit',
            category: 'Income',
            merchant_name: 'ABC Corp',
            is_recurring: true,
            recurring_frequency: 'monthly'
        });
        transactions.push({
            user_id: userId,
            bank_profile_id: hnbId,
            transaction_hash: crypto.randomUUID(),
            transaction_date: new Date(today.getFullYear(), today.getMonth() - 1, 25).toISOString(), // Salary Prev Month
            description: 'SALARY CREDIT - ABC CORP',
            original_description: 'SALARY CREDIT - ABC CORP',
            amount: 250000,
            transaction_type: 'credit',
            category: 'Income',
            merchant_name: 'ABC Corp',
            is_recurring: true,
            recurring_frequency: 'monthly'
        });

        // Expenses
        const merchants = [
            { name: 'Uber Eats', cat: 'Food & Dining', min: 1200, max: 4500 },
            { name: 'Keells Super', cat: 'Shopping', min: 3000, max: 15000 },
            { name: 'Netflix', cat: 'Subscription', amount: 1200, recurring: true },
            { name: 'Dialog Axiata', cat: 'Bills & Utilities', min: 2000, max: 5000 },
            { name: 'PickMe', cat: 'Transportation', min: 400, max: 1500 },
            { name: 'Food City', cat: 'Shopping', min: 1000, max: 8000 },
            { name: 'Spotify', cat: 'Subscription', amount: 550, recurring: true },
            { name: 'SLT Fibre', cat: 'Bills & Utilities', amount: 6500, recurring: true },
            { name: 'Cafe Noir', cat: 'Food & Dining', min: 2500, max: 6000 },
            { name: 'Odel', cat: 'Shopping', min: 5000, max: 25000 }
        ];

        // Generate random HNB expenses
        for (let i = 0; i < 40; i++) {
            const m = merchants[Math.floor(Math.random() * merchants.length)];
            const amount = m.amount || Math.floor(Math.random() * (m.max! - m.min!) + m.min!);

            transactions.push({
                user_id: userId,
                bank_profile_id: hnbId,
                transaction_hash: crypto.randomUUID(),
                transaction_date: randomDate(startDate, today),
                description: `POS PURCHASE - ${m.name.toUpperCase()}`,
                original_description: `POS PURCHASE ${m.name} COLOMBO`,
                amount: amount,
                transaction_type: 'debit',
                category: m.cat,
                merchant_name: m.name,
                is_recurring: m.recurring || false,
                is_anomaly: amount > 20000 // Flag large purchases as anomaly
            });
        }

        // ComBank Transactions (Savings - Less active)
        transactions.push({
            user_id: userId,
            bank_profile_id: comId,
            transaction_hash: crypto.randomUUID(),
            transaction_date: randomDate(startDate, today),
            description: 'INTEREST CREDIT',
            original_description: 'INTEREST CREDIT',
            amount: 1250,
            transaction_type: 'credit',
            category: 'Income',
            merchant_name: 'Commercial Bank'
        });

        transactions.push({
            user_id: userId,
            bank_profile_id: comId,
            transaction_hash: crypto.randomUUID(),
            transaction_date: randomDate(startDate, today),
            description: 'ATM WITHDRAWAL',
            original_description: 'ATM WITHDRAWAL 001',
            amount: 5000,
            transaction_type: 'debit',
            category: 'Transfer',
            merchant_name: null
        });

        const { error: transError } = await supabase
            .from('transactions')
            .insert(transactions);

        if (transError) {
            console.error('Trans error:', transError);
            throw transError;
        }

        toast.success('Dummy data seeded successfully!');
        window.location.reload(); // Refresh to show data

    } catch (error: any) {
        console.error('Seeding failed:', error);
        toast.error(`Seeding failed: ${error.message}`);
    }
};
