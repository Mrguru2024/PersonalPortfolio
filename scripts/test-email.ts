import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local file:', error);
}

import { emailService } from '../server/services/emailService';

async function testEmail() {
  console.log('🧪 Testing email notification system...\n');

  // Test quote request notification
  console.log('Sending test quote request notification...');
  const result = await emailService.sendNotification({
    type: 'quote',
    data: {
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-1234',
      company: 'Test Company',
      projectType: 'Web Application',
      budget: '$5,000 - $10,000',
      timeframe: '1-3 months',
      message: 'This is a test quote request to verify email notifications are working correctly.',
      newsletter: true
    }
  });

  if (result) {
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox at 5epmgllc@gmail.com');
  } else {
    console.log('❌ Email not sent. Check your Brevo configuration.');
    console.log('   Make sure BREVO_API_KEY is set in .env.local');
  }

  process.exit(0);
}

testEmail();
