const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, userName } = JSON.parse(event.body);

        const msg = {
            to: email,
            from: 'hatem.shaban@gmail.com',
            subject: 'Welcome to StartupStack - Your AI Toolkit Awaits!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #6366f1;">🎉 Welcome to StartupStack!</h1>
                    <p>Thank you for joining our community of entrepreneurs. Your AI-powered toolkit includes:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin: 10px 0;">✨ Business Name Generator - Create unique, brandable names</li>
                        <li style="margin: 10px 0;">🎨 Logo Creator - Professional designs in seconds</li>
                        <li style="margin: 10px 0;">📊 Pitch Deck Generator - Investor-ready presentations</li>
                        <li style="margin: 10px 0;">🔍 Market Research Tool - Competitive analysis</li>
                        <li style="margin: 10px 0;">📅 Content Calendar - Social media planning</li>
                        <li style="margin: 10px 0;">📧 Email Templates - Marketing sequences</li>
                        <li style="margin: 10px 0;">📝 Legal Document Generator - Contracts & policies</li>
                        <li style="margin: 10px 0;">💰 Financial Projections - Revenue modeling</li>
                    </ul>
                    <p>Ready to get started? Click the button below to access your dashboard:</p>
                    <a href="${process.env.URL}/dashboard.html" 
                       style="display: inline-block; background: linear-gradient(to right, #6366f1, #ec4899); 
                              color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                              margin: 20px 0;">
                        Access Your Dashboard
                    </a>
                    <p style="color: #666;">Need help? Reply to this email and our support team will assist you.</p>
                </div>
            `
        };

        await sgMail.send(msg);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Welcome email sent successfully' })
        };
    } catch (error) {
        console.error('Email sending failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send welcome email' })
        };
    }
};