# Email & Push Notification Setup Guide

This guide explains how to set up email and push notifications for your portfolio website.

## Email Notifications (Brevo - formerly Sendinblue)

Email notifications are sent when:
- ✅ Contact form submissions
- ✅ Quote requests
- ✅ Resume requests
- ✅ Blog post comments
- ✅ Skill endorsements

### Setup Steps:

1. **Create a Brevo Account**
   - Go to [Brevo](https://www.brevo.com) and create a free account
   - Free tier includes 300 emails per day (9,000 per month)

2. **Get Your API Key**
   - Navigate to Settings → SMTP & API → API Keys
   - Click "Generate a new API key"
   - Name it (e.g., "Portfolio Notifications")
   - Select "Send emails" permissions
   - Copy the API key (you'll only see it once!)

3. **Verify Your Sender Email**
   - Go to Senders → Add a sender
   - Enter your email address and verify it
   - Use this email as your `FROM_EMAIL`

4. **Update Your .env.local File**
   ```env
   BREVO_API_KEY=your_brevo_api_key_here
   FROM_EMAIL=your_verified_email@example.com
   FROM_NAME=MrGuru.dev Portfolio
   ADMIN_EMAIL=5epmgllc@gmail.com
   ```

5. **Test the Setup**
   - Run `npm run test:email` to send a test email
   - Or submit a contact form or quote request on your website
   - Check your email (5epmgllc@gmail.com) for the notification
   - Check the server logs for any errors

## Push Notifications (Optional)

Push notifications allow you to receive browser notifications even when the website isn't open.

### Setup Steps:

1. **Install web-push package** (if not already installed)
   ```bash
   npm install web-push
   ```

2. **Generate VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Add to .env.local**
   ```env
   VAPID_PUBLIC_KEY=your_public_key_here
   VAPID_PRIVATE_KEY=your_private_key_here
   ```

4. **Subscribe to Notifications**
   - Users can subscribe to push notifications from the website
   - Notifications will be sent for all inquiry types

## Email Templates

The system includes beautifully formatted HTML email templates for:
- 📧 Contact form submissions
- 💰 Quote requests (highlighted as business opportunities)
- 📄 Resume requests
- ⭐ Skill endorsements
- 💬 Blog post comments

All emails include:
- Professional HTML formatting
- All inquiry details
- Reply-to address set to the sender's email
- Clear call-to-action

## Troubleshooting

### Emails Not Sending

1. **Check Brevo API Key**
   - Verify the key is correct in `.env.local`
   - Ensure the key has "Send emails" permissions

2. **Check Sender Verification**
   - The `FROM_EMAIL` must be verified in Brevo
   - Check Brevo dashboard → Senders for verification status

3. **Check Server Logs**
   - Look for error messages in the console
   - Brevo errors will be logged with details

4. **Test with Brevo API**
   - Use Brevo's test email feature or run `npm run test:email`

### Common Issues

- **"Invalid API Key"**: Check that your API key is correct and has proper permissions
- **"Sender not verified"**: Verify your sender email in Brevo dashboard → Senders
- **"Rate limit exceeded"**: Free tier allows 300 emails/day (9,000/month), upgrade if needed
- **Emails going to spam**: Set up SPF/DKIM records via Domain Authentication in Brevo

## Notification Types

### Contact Form
- Triggered when someone submits the general contact form
- Includes: name, email, subject, message

### Quote Request
- Triggered when someone requests a project quote
- Includes: contact info, project type, budget, timeframe, description
- **Highlighted as a business opportunity** ⚠️

### Resume Request
- Triggered when someone requests your resume
- Includes: requester info, purpose, access token

### Blog Comment
- Triggered when someone comments on a blog post
- Includes: commenter info, post title, comment content

### Skill Endorsement
- Triggered when someone endorses a skill
- Includes: endorser info, skill ID, rating, comment

## Security Notes

- API keys are stored in `.env.local` (never commit to git)
- Email addresses are validated before sending
- Reply-to is set to the sender's email for easy responses
- All notifications are logged for debugging

## Next Steps

1. Set up SendGrid account and API key
2. Add credentials to `.env.local`
3. Test by submitting a contact form
4. (Optional) Set up push notifications for real-time alerts
