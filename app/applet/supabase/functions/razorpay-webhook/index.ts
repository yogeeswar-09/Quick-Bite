import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

serve(async (req) => {
  try {
    // 1. Get the signature from the headers
    const signature = req.headers.get('x-razorpay-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 400 })
    }

    // 2. Get the raw body for signature verification
    const bodyText = await req.text()
    
    // 3. Verify the signature
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!secret) {
      throw new Error('Webhook secret not configured in Edge Function')
    }

    const expectedSignature = hmac("sha256", secret, bodyText, "utf8", "hex");

    if (expectedSignature !== signature) {
      return new Response('Invalid signature', { status: 400 })
    }

    // 4. Parse the payload
    const payload = JSON.parse(bodyText)
    const event = payload.event

    // Initialize Supabase client with Service Role key to securely update the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 5. Handle the event
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payload.payment.entity
      // Assuming you pass the Supabase order ID in the notes object when creating the Razorpay order
      const orderId = payment.notes?.orderId 

      if (orderId) {
        // Update order status in Supabase
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'Preparing', // Move to preparing once paid
            payment_status: 'Paid',
            payment_id: payment.id
          })
          .eq('id', orderId)

        if (error) throw error
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity
      const orderId = payment.notes?.orderId

      if (orderId) {
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'Failed'
          })
          .eq('id', orderId)
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
