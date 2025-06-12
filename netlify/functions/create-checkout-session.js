const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration');
}

// Initialize Supabase with proper error handling
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        }
    }
);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        if (event.httpMethod !== 'POST') {
            throw new Error('Method not allowed');
        }

        const { customerEmail, priceId } = JSON.parse(event.body);
        if (!customerEmail || !priceId) {
            throw new Error('Missing required parameters');
        }        // Map price ID to plan type
        const priceToPlan = {
            'price_1RYhFGE92IbV5FBUqiKOcIqX': 'lifetime',
            'price_1RYhAlE92IbV5FBUCtOmXIow': 'starter',
            'price_1RSdrmE92IbV5FBUV1zE2VhD': 'pro'
        };

        const planType = priceToPlan[priceId];
        if (!planType) {
            console.error('Invalid price ID:', priceId);
            throw new Error('Invalid price selected');
        }

        // Validate plan type against database constraints
        if (!['starter', 'pro', 'lifetime'].includes(planType)) {
            console.error('Invalid plan type:', planType);
            throw new Error('Invalid subscription plan');

        // Create or get user account
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', customerEmail)
            .maybeSingle();

        if (userError) throw userError;

        // If user exists, check their subscription status
        if (user) {
            if (user.subscription_status === 'active' || user.subscription_status === 'lifetime_active') {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'User already has an active subscription' })
                };
            }
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: planType === 'lifetime' ? 'payment' : 'subscription',
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/?checkout=cancelled`,
            customer_email: customerEmail,            metadata: {
                email: customerEmail,
                priceId: priceId,
                planType: planType
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                id: session.id,
                success: true
            })
        };

    } catch (error) {
        console.error('Checkout session error:', error);
        return {
            statusCode: error.statusCode || 500,
            headers,
            body: JSON.stringify({
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error : undefined
            })
        };
    }
};