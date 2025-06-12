const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

        const { sessionId } = JSON.parse(event.body);
        if (!sessionId) {
            throw new Error('Session ID is required');
        }        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items']
        });
        
        if (!session || session.status !== 'complete') {
            throw new Error('Invalid or incomplete session');
        }        // Get and validate plan type from session metadata
        const planType = session.metadata.planType;
        if (!planType || !['starter', 'pro', 'lifetime'].includes(planType)) {
            throw new Error('Invalid plan type in session');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                planType,
                customerEmail: session.customer_email,
                sessionId: session.id
            })
        };

    } catch (error) {
        console.error('Session verification error:', error);
        return {
            statusCode: error.statusCode || 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
