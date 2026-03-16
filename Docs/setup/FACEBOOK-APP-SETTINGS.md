# Facebook App Settings — Complete Checklist

Use this guide to fill in your [Facebook Developer App](https://developers.facebook.com/apps/) so Facebook Login works with your site (Ascendra Technologies).

---

## 1. App Dashboard → Settings → Basic

| Field | Value to use |
|-------|----------------|
| **App Name** | `Ascendra Technologies` (or your public app name) |
| **App Nickname** | Optional; e.g. `Ascendra` (internal only) |
| **App Domains** | Add one per line: `ascendra.tech` and `www.ascendra.tech` |
| **Privacy Policy URL** | `https://www.ascendra.tech/privacy` |
| **Terms of Service URL** | `https://www.ascendra.tech/terms` |
| **User Data Deletion** | `https://www.ascendra.tech/data-deletion-request` (required for App Review; optional for development) |
| **Category** | e.g. `Business and Pages` or `Website` |
| **App Icon** | Upload a 1024×1024 px icon (optional but recommended) |

**Notes:**
- App Domains: do **not** include `http://` or `https://` or paths—only the domain.
- If you use another production domain later, add it to App Domains and to the redirect URIs below.

---

## 2. Add Product: Facebook Login

1. In the left sidebar, click **Add Product** (or **Products**).
2. Find **Facebook Login** and click **Set Up**.
3. Choose **Web** as the platform.

---

## 3. Facebook Login → Settings

Open **Facebook Login** → **Settings** in the left menu.

| Setting | Value |
|---------|--------|
| **Client OAuth Login** | **Yes** |
| **Web OAuth Login** | **Yes** |
| **Valid OAuth Redirect URIs** | Add these **one per line** (exact strings): |
| | `http://localhost:3000/api/auth/facebook/callback` |
| | `https://www.ascendra.tech/api/auth/facebook/callback` |
| **Enforce HTTPS in Redirect URIs** | **Yes** (for production); localhost can stay http |
| **Allowed Domains for the JavaScript SDK** | Leave empty if you only use server-side redirect; otherwise add `ascendra.tech` and `www.ascendra.tech` |
| **Login from Devices** | Optional; turn **Off** if you only use web |

**Important:** The redirect URI must match exactly what your app sends (including path `/api/auth/facebook/callback`). No trailing slash.

---

## 4. App Mode: Development vs Live

- **Development:** Only you (and added test users/roles) can sign in with Facebook. Good for testing.
- **Live:** Anyone can use Facebook Login. Requires [App Review](https://developers.facebook.com/docs/app-review) for certain permissions (e.g. `email`, `public_profile`).

For **email** and **public_profile** (name, picture), Facebook usually allows them without App Review when your app is in Development. When you switch to Live, if you only request these, you often don’t need full App Review.

---

## 5. Optional but Recommended

| Where | What to set |
|-------|-------------|
| **Settings → Basic** | **Data Deletion Instructions URL** — use `https://www.ascendra.tech/data-deletion-request` so Facebook can point users to your form. |
| **App Review** | When going Live, ensure you’ve completed **App Details** (Privacy Policy, Terms, etc.). |
| **Roles** | Add other developers under **Roles → Administrators/Developers** if needed. |

---

## 6. Values for Your App

Copy these into your app’s config (e.g. `.env.local`); you already have the keys in place:

- **App ID** → `FACEBOOK_APP_ID` (e.g. from Settings → Basic)
- **App Secret** → `FACEBOOK_APP_SECRET` (from Settings → Basic; keep secret)

Your callback URL in code should be:

- **Development:** `http://localhost:3000/api/auth/facebook/callback`
- **Production:** `https://www.ascendra.tech/api/auth/facebook/callback`

Use the same base URL (e.g. from `NEXT_PUBLIC_APP_URL`) when building the callback URL in your auth route.

---

## Quick checklist

- [ ] Settings → Basic: App Domains, Privacy Policy URL, Terms of Service URL (and Data Deletion URL if required)
- [ ] Facebook Login → Settings: Client OAuth Login = Yes, Web OAuth Login = Yes
- [ ] Valid OAuth Redirect URIs: localhost + production callback URLs added
- [ ] `.env.local`: `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` set
- [ ] Implement `/api/auth/facebook/route.ts` and `/api/auth/facebook/callback/route.ts` if not already present

After changing redirect URIs or domains, wait a minute and try logging in again; Facebook caches config briefly.

---

## 7. How to Start App Review

App Review is required when your app is **Live** and you need permissions beyond the default (e.g. `email`, `public_profile`). For basic Login with just email and profile, you often don’t need to submit for review—but if you do, or if you add more permissions later, follow this.

### Before you submit

1. **Complete App Details**  
   In the app dashboard: **Settings → Basic**. Fill in Privacy Policy URL, Terms of Service URL, User Data Deletion (callback or instructions URL), Category, and App Icon. Incomplete details can cause rejection.

2. **Provide a test account (if requested)**  
   For Login permissions, Facebook may ask how to test. Have a test Facebook user (or your own) and steps to reproduce the login flow (e.g. “Click Login with Facebook on https://www.ascendra.tech”).

3. **Record a short video (if required)**  
   Some permissions require a screen recording showing the permission in use in your app (e.g. user clicking Facebook Login and landing back on your site). Use a tool like Loom or OBS; keep it under 2 minutes.

### Start the review

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps/) and select your app.
2. In the left sidebar, open **App Review** → **Requests** (or **Permissions and Features**).
3. Find the permission you need (e.g. **Facebook Login** with `email`). If it says “Standard Access” or “No review required,” you may not need to submit.
4. Click **Request** (or **Request Advanced Access** for advanced permissions).
5. Complete the form:
   - **Use case:** Describe why your app needs the permission (e.g. “We use Facebook Login so users can sign in with their Facebook account. We request email to create their account and send transactional emails.”).
   - **Step-by-step instructions:** e.g. “1. Go to https://www.ascendra.tech 2. Click ‘Log in with Facebook’ 3. Authorize the app 4. You are redirected back to the dashboard.”
   - **Screencast / video:** Upload if the form asks for it.
   - **Test user:** Provide a test Facebook account if requested.
6. Submit. Review can take from a few days to a couple of weeks. You’ll get an email when there’s an update.

### Tips

- Request only the permissions you actually use. Extra permissions increase scrutiny.
- Keep the use case and instructions clear and short. Reviewers need to see the flow quickly.
- If rejected, read the reason and resubmit after fixing (e.g. add missing URLs, better video, or clearer instructions).

---

## 8. How to Use Graph API Explorer

The [Graph API Explorer](https://developers.facebook.com/tools/explorer/) lets you try Facebook Graph API calls and get access tokens without writing code. Useful for testing what data your app can read (e.g. after login).

### Open the tool

1. Go to **[developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer/)**.
2. Log in with your Facebook account if prompted.

### Select your app

1. At the top, use the **Meta App** dropdown.
2. Choose **Ascendra Technologies** (or your app name).  
   This sets the App ID and App Secret context for the explorer.

### Get an access token

1. Click **Generate Access Token** (or the token field).
2. A dialog lists **Permissions**. For login-related testing, enable at least:
   - **email**
   - **public_profile** (often includes `id`, `name`, `picture`)
3. Click **Generate Access Token** and approve in the Facebook login popup.
4. The token appears in the **Access Token** field. It’s a **User Access Token** for your user (good for testing; don’t share it).

### Run a query

1. In **API Version**, pick the same version your app uses (e.g. the default).
2. In the **Request** section, the path defaults to `me`. That returns the logged-in user’s profile.
3. To request specific fields, use the **Add a field** (or query builder) and add e.g. `id,name,email,picture` so the path becomes:  
   `me?fields=id,name,email,picture`
4. Choose **GET** (default for reading data).
5. Click **Submit**.
6. The **Response** panel shows JSON with the data your token can access. If a field is missing (e.g. email), the permission may not be granted or approved for your app.

### Useful endpoints for login testing

| What you want | Path (or fields) |
|---------------|-------------------|
| Basic profile | `me` or `me?fields=id,name` |
| With email | `me?fields=id,name,email` |
| With picture | `me?fields=id,name,email,picture` |
| Picture URL only | `me?fields=id,name,picture.type(large)` |

### Token types (short)

- **User Access Token (short-lived):** From “Generate Access Token” in the explorer; lasts a few hours. Use for quick tests.
- **User Access Token (long-lived):** Exchange short-lived in your backend; lasts ~60 days. Use for real app flows.
- **App Access Token:** For app-level calls (e.g. some server-side checks). In the explorer you usually work with user tokens.

### If something fails

- **Invalid OAuth access token:** Token expired or wrong app. Generate a new token and ensure the correct app is selected.
- **Insufficient permissions:** Add the right permission in the token dialog and generate again.
- **Permission not granted:** For Live apps, the permission may need App Review (see section 7).
