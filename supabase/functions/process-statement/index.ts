
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
    let statementSummary = {};

    if (textContent && geminiKey) {
      // AI Processing with Gemini
      // Improved AI Prompt for structured extraction
      const prompt = `
        You are a precise financial data extraction assistant.
        Analyze the following bank statement text and extract all transactions into a strict JSON object.
        
        CRITICAL RULES:
        1. Output ONLY valid JSON. No markdown formatting, no comments.
        2. The output must be an object containing "summary" and "transactions".
        3. Extract opening balance, closing balance, total debits, and total credits if available.
        4. "transactions" must be an array of objects.
        5. Identify RECURRING transactions. Set "is_recurring": true for subscriptions (Netflix, Spotify, Apple, Google, Adobe, Gym), utilities (Water, Electric, Internet, Phone), Insurance, and Rent.
        
        REQUIRED JSON STRUCTURE:
        {
          "summary": {
            "opening_balance": number or null,
            "closing_balance": number or null,
            "total_debits": number or null,
            "total_credits": number or null
          },
          "transactions": [
            {
              "date": "YYYY-MM-DD",
              "description": "Full original description",
              "amount": number (negative for expenses, positive for income),
              "category": "Best guess category",
              "merchant": "Clean merchant name",
              "is_recurring": boolean
            }
          ]
        }

        Bank Statement Text:
        """
        ${textContent.substring(0, 30000)}
        """
      `;

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });

      const geminiData = await geminiResponse.json();

      if (geminiData.error) {
        throw new Error(`Gemini API Error: ${geminiData.error.message}`);
      }

      const candidate = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      let parsedResult = { transactions: [], summary: {} };

      if (!candidate) {
        console.warn("No content in Gemini response");
      } else {
        const cleanedText = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          parsedResult = JSON.parse(cleanedText);
          // Handle case where AI ignores instructions and returns array directly (fallback)
          if (Array.isArray(parsedResult)) {
            parsedResult = { transactions: parsedResult, summary: {} };
          }
          transactions = parsedResult.transactions || [];
          statementSummary = parsedResult.summary || {};
        } catch (e) {
          console.error("Failed to parse JSON from AI response:", cleanedText);
          throw new Error("AI response was not valid JSON");
        }
      }

    } else {
      // Fallback or Demo Mode
      console.log("No text content or API key, using demo data");
      transactions = [
        { date: new Date().toISOString().split('T')[0], description: 'AMAZON PURCHASE', amount: -89.99, category: 'Shopping', merchant: 'Amazon' },
        { date: new Date().toISOString().split('T')[0], description: 'SALARY DEPOSIT', amount: 5000.00, category: 'Income', merchant: 'Employer' },
      ];
      statementSummary = {
        opening_balance: 1000,
        closing_balance: 5910,
        total_debits: 90,
        total_credits: 5000
      };
    }

    // Ensure transactions is available for DB insert logic below
    // (Existing code uses 'transactions' variable)


    if (saveToDb && userId && bankProfileId) {
      const inserts = transactions.map((tx: any) => ({
        user_id: userId,
        bank_profile_id: bankProfileId,
        statement_id: statementId,
        transaction_hash: `${userId}-${tx.date}-${tx.amount}-${tx.description.substring(0, 20)}`, // Deterministic hash to prevent dupes
        transaction_date: tx.date || new Date().toISOString().split('T')[0],
        description: tx.description,
        original_description: tx.description,
        amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount, // Ensure number
        transaction_type: (typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount) > 0 ? 'credit' : 'debit',
        category: tx.category,
        category_confidence: 0.9,
        merchant_name: tx.merchant,
        is_recurring: tx.is_recurring || false,
      }));

      // Bulk insert for performance
      if (inserts.length > 0) {
        const { error } = await supabase.from('transactions').insert(inserts);
        if (error) throw error;
      }

      // Update status to completed
      if (statementId) {
        await supabase.from('statements').update({
          status: 'completed',
          processed_at: new Date().toISOString()
        }).eq('id', statementId);
      }
    }

    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    return new Response(JSON.stringify({
      success: true,
      count: transactions.length,
      totalAmount,
      summary: statementSummary
    }), {
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
