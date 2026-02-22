const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInserts() {
    console.log('Testing data insert...');

    // Simulating frontend payload
    const variant_id = "fbda3bc5-7dcf-4bd9-abb7-26804d1ad9f0"; // Need a real valid UUID from DB. Let's get one first.

    const { data: v } = await supabase.from('product_variants').select('id, product_id').limit(1).single();
    if (!v) {
        console.error("No variants found");
        return;
    }

    const qty = 1;
    const unit_cost = "5";
    const utility_percentage = "200";
    const unit_price = "15";
    const exchange_rate = 60;

    console.log("Variante ID:", v.id);

    const { data: movement, error: insertError } = await supabase
        .from('stock_movements')
        .insert([{
            variant_id: v.id,
            product_id: v.product_id,
            quantity: qty,
            type: 'purchase',
            reason: 'Test script',
            unit_cost: parseFloat(unit_cost),
            utility_percentage: parseFloat(utility_percentage),
            unit_price: parseFloat(unit_price),
            exchange_rate,
            total_value: qty * parseFloat(unit_cost)
        }])
        .select()
        .single();

    if (insertError) {
        console.error("Error inserting movement:", insertError);
        return;
    }
    console.log("Movement OK:", movement.id);

    const updatePayload = {
        price_override: parseFloat(unit_price),
        last_unit_cost: parseFloat(unit_cost),
        last_utility_percentage: parseFloat(utility_percentage)
    };

    const { error: updErr } = await supabase.from('product_variants').update(updatePayload).eq('id', v.id);
    if (updErr) {
        console.error("Error updating variant:", updErr);
    } else {
        console.log("Variant Update OK");
    }
}

checkInserts();
