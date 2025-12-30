import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { statementId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase.from('statements').update({ status: 'processing' }).eq('id', statementId);

    // Get statement details
    const { data: statement } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .single();

    if (!statement) {
      throw new Error('Statement not found');
    }

    // Generate sample transactions for demo (real PDF parsing would happen here)
    const sampleTransactions = [
      { description: 'AMAZON PURCHASE', amount: -89.99, category: 'Shopping', merchant: 'Amazon' },
      { description: 'SALARY DEPOSIT', amount: 5000.00, category: 'Income', merchant: 'Employer' },
      { description: 'NETFLIX SUBSCRIPTION', amount: -15.99, category: 'Subscription', merchant: 'Netflix', is_recurring: true },
      { description: 'STARBUCKS COFFEE', amount: -6.50, category: 'Food & Dining', merchant: 'Starbucks' },
      { description: 'UBER RIDE', amount: -24.00, category: 'Transportation', merchant: 'Uber' },
    ];

    for (const tx of sampleTransactions) {
      const hash = `${statement.user_id}-${Date.now()}-${Math.random()}`;
      await supabase.from('transactions').insert({
        user_id: statement.user_id,
        bank_profile_id: statement.bank_profile_id,
        statement_id: statementId,
        transaction_hash: hash,
        transaction_date: new Date().toISOString().split('T')[0],
        description: tx.description,
        original_description: tx.description,
        amount: Math.abs(tx.amount),
        transaction_type: tx.amount > 0 ? 'credit' : 'debit',
        category: tx.category,
        category_confidence: 0.85,
        merchant_name: tx.merchant,
        is_recurring: tx.is_recurring || false,
      });
    }

    // Update status to completed
    await supabase.from('statements').update({ 
      status: 'completed',
      processed_at: new Date().toISOString()
    }).eq('id', statementId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error processing statement:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
