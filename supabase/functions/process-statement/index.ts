
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
    const { statementId, textContent, saveToDb } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    if (statementId) {
      await supabase.from('statements').update({ status: 'processing' }).eq('id', statementId);
    }

    // Get statement details to know user_id etc, if specific ID provided
    let userId, bankProfileId;

    if (statementId) {
      const { data: statement } = await supabase
        .from('statements')
        .select('*')
        .eq('id', statementId)
        .single();

      if (statement) {
        userId = statement.user_id;
        bankProfileId = statement.bank_profile_id;
      }
    }

    let transactions = [];

    if (textContent && geminiKey) {
      // AI Processing with Gemini
      const prompt = `
        Analyze this bank statement text and extract all transactions into a JSON array.
        Ignore headers, footers, and summaries.
        For each transaction, provide:
        - date (YYYY-MM-DD format)
        - description (string)
        - amount (number, negative for debit/expense, positive for credit/income)
        - category (guess based on description, e.g., 'Food & Dining', 'Shopping', 'Bills & Utilities', 'Transfer', 'Income')
        - merchant (extracted merchant name or simplified description)

        Text:
        ${textContent.substring(0, 30000)} // Limit context window safely
        `;

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const geminiData = await geminiResponse.json();

      if (geminiData.error) {
        throw new Error(`Gemini API Error: ${geminiData.error.message}`);
      }

      const rawText = geminiData.candidates[0].content.parts[0].text;
      // Extract JSON from markdown code block if present
      const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }

    } else {
      // Fallback or Demo Mode if no Key/Text
      // Generate sample transactions for demo (real PDF parsing would happen here)
      console.log("No text content or API key, using demo data");
      transactions = [
        { description: 'AMAZON PURCHASE', amount: -89.99, category: 'Shopping', merchant: 'Amazon' },
        { description: 'SALARY DEPOSIT', amount: 5000.00, category: 'Income', merchant: 'Employer' },
        { description: 'NETFLIX SUBSCRIPTION', amount: -15.99, category: 'Subscription', merchant: 'Netflix', is_recurring: true },
      ];
    }

    if (saveToDb && userId && bankProfileId) {
      for (const tx of transactions) {
        const hash = `${userId}-${Date.now()}-${Math.random()}`;
        await supabase.from('transactions').insert({
          user_id: userId,
          bank_profile_id: bankProfileId,
          statement_id: statementId, // Can be null or 'log' ID
          transaction_hash: hash,
          transaction_date: tx.date || new Date().toISOString().split('T')[0],
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
      if (statementId) {
        await supabase.from('statements').update({
          status: 'completed',
          processed_at: new Date().toISOString()
        }).eq('id', statementId);
      }
    }

    return new Response(JSON.stringify({ success: true, count: transactions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error processing statement:', error);
    let message = error instanceof Error ? error.message : 'Unknown error';

    // If model not found, try to list available models to help debug
    if (message.includes('not found') || message.includes('not supported')) {
      try {
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        const listData = await listResp.json();
        if (listData.models) {
          const availableModels = listData.models.map((m: any) => m.name).join(', ');
          message += ` | AVAILABLE MODELS: ${availableModels}`;
        }
      } catch (listError) {
        message += ` | Failed to list models: ${listError}`;
      }
    }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
