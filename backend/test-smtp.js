
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSmtp() {
    console.log('Testing SMTP Configuration...');

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';

    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`User: ${user ? '******' : 'MISSING'}`);
    console.log(`Pass: ${pass ? '******' : 'MISSING'}`);
    console.log(`Secure: ${secure}`);

    if (!host || !port || !user || !pass) {
        console.error('❌ Missing SMTP configuration in .env file.');
        return;
    }

    const transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }, // Matches service config
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error.message);
        if (error.code === 'EAUTH') console.error('  -> Check your username and password.');
        if (error.code === 'ESOCKET') console.error('  -> Check your host and port.');
        return;
    }

    try {
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"IST Africa Test" <${user}>`,
            to: user, // Send to self
            subject: 'IST Africa - SMTP Test',
            text: 'If you receive this, your SMTP configuration is working correctly.',
        });
        console.log('✅ Test Email Sent!', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
    }
}

testSmtp();
