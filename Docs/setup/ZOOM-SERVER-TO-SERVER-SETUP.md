# Zoom Server-to-Server OAuth — Setup Guide

This guide walks you through creating a **Server-to-Server OAuth** app in Zoom so Ascendra can **schedule and start Zoom meetings** from the CRM (lead profile → Meetings tab).

No user login is required: the app uses one Zoom account (yours or your company’s) to create meetings on your behalf.

---

## Don’t have permission to create an app?

Zoom only allows **certain accounts** to create developer apps. If you see a permission error or don’t see **Build App** / **Create**:

### 1. You must be the **Owner** of the Zoom account

- **Admin** is not enough. Only the **account Owner** can create apps in the Marketplace.
- **If you’re not the owner:** Ask your Zoom account owner (or IT) to either:
  - Create the Server-to-Server OAuth app and give you the **Account ID**, **Client ID**, and **Client Secret**, or  
  - Make you the **Owner** of a (sub-)account that can create apps.

To check your role: sign in at [zoom.us](https://zoom.us) → **Profile** or **Account Management**. Your role is shown there (Owner, Admin, Member, etc.).

### 2. Free Zoom accounts are often restricted

- Many **free** Zoom accounts cannot create developer apps (the “Build App” or “Create” option may be missing or blocked).
- **Fix:** Upgrade to a **paid** Zoom plan (e.g. Pro, Business) on the account you use for the Marketplace, then try again.  
  Upgrade: [zoom.us/pricing](https://zoom.us/pricing) or **Account** → **Billing** in the Zoom web portal.

### 3. Use the right Zoom account

- Sign in at [marketplace.zoom.us](https://marketplace.zoom.us) with the account that is **Owner** and (if applicable) **paid**.
- If your company has a Zoom account, the **owner** of that account (or an admin with app-creation rights) must create the app.

### 4. Accept the developer agreement (if prompted)

- The first time you create an app, Zoom may ask you to accept the **Marketplace Developer Agreement**. Accept it to continue.

### 5. Still stuck?

- **Zoom Developer Forum:** [devforum.zoom.us](https://devforum.zoom.us) — search for “permission” or “create app”.
- **Zoom Build / account docs:** [developers.zoom.us/docs/build/account/](https://developers.zoom.us/docs/build/account/).

Once you can create an app (as Owner on a supported account), continue below.

---

## 1. Go to the Zoom Marketplace

1. Open **[Zoom Marketplace](https://marketplace.zoom.us/)** in your browser.
2. Sign in with the Zoom account that will **own** the meetings (your account or your company’s).
3. Click **Develop** → **Build App** (or go to [marketplace.zoom.us/user/build](https://marketplace.zoom.us/user/build)).

---

## 2. Create a Server-to-Server OAuth App

1. On the Build page, find **Server-to-Server OAuth**.
2. Click **Create**.
3. Fill in:
   - **App name:** e.g. `Ascendra CRM` or `Ascendra Technologies`
   - **Short description:** e.g. `Schedule and start meetings from Ascendra CRM`
   - **Company name:** Your company name
   - **Developer email:** Your email
   - **App logo:** Optional
4. Click **Create**.

---

## 3. Add Scopes (Permissions)

The app needs permission to create and read meetings.

1. In the app’s left menu, open **Scopes** (or **Permissions**).
2. Click **Add Scopes**.
3. Add these **Server-to-Server** scopes:
   - **`meeting:write:admin`** — Create and update meetings  
     (or **`meeting:write`** if you don’t see the admin one)
   - **`meeting:read:admin`** — Read meeting details  
     (or **`meeting:read`**)
4. Save / **Done**.

---

## 4. Activate the App and Get Credentials

1. In the left menu, open **Activation** (or **Information** / **Credentials**).
2. Click **Activate your app** (or similar) so the app is in **Activated** state.
3. You’ll see three values. Copy them; you’ll put them in `.env.local`:

   | In Zoom | In your app (.env.local) |
   |--------|---------------------------|
   | **Account ID** | `ZOOM_ACCOUNT_ID` |
   | **Client ID** | `ZOOM_CLIENT_ID` |
   | **Client Secret** | `ZOOM_CLIENT_SECRET` |

   **Where to find them:**
   - **Account ID** — Usually on the same page as the app, or under **App credentials** / **Activation**. It’s a long string (e.g. `xxxxxxxxxx`).
   - **Client ID** and **Client Secret** — Under **App credentials** or the **Development** / **Credentials** section. Click **Copy** for each.

**Important:** Never commit the Client Secret to git. Keep it only in `.env.local` (and in your production env vars).

---

## 5. Add Credentials to Your Project

1. Open your project’s **`.env.local`** (create it from `.env.example` if needed).
2. Add or edit:

```env
# Zoom (Schedule & start meetings from CRM)
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
```

3. Replace the placeholders with the values from the Zoom app.
4. Save the file and restart your dev server (`npm run dev`) so the new env vars load.

---

## 6. Verify in Ascendra

1. Log in to Ascendra as an **admin**.
2. Open **Admin** → **Integrations** (super admin only).
3. Find **Zoom (Meetings)** — it should show **Connected** and a green status if the credentials are set.
4. Click **Test** to confirm Zoom accepts the credentials (token is fetched successfully).
5. Open **CRM** → open a lead → **Meetings** tab. You should see the **Schedule with Zoom** section. Create a test meeting and use **Start meeting** or **Join link**.

---

## 7. Troubleshooting

| Issue | What to check |
|-------|----------------|
| **“Zoom is not configured”** | Ensure all three env vars are set in `.env.local` and the dev server was restarted. |
| **Test fails: “invalid credentials”** | Double-check Account ID, Client ID, and Client Secret (no extra spaces, correct app). |
| **Test fails: “unauthorized” / 401 | Make sure the app is **Activated** and the scopes **meeting:write** and **meeting:read** (or their admin variants) are added. |
| **“Schedule with Zoom” doesn’t appear** | Only shown when Zoom is configured. Check Admin → Integrations and run **Test**. |
| **Meeting created but can’t start** | Use the **Start meeting (host)** link; the Zoom account that owns the app must start the meeting. |

---

## 8. Optional: Production

- In production (e.g. Vercel), add the same three variables in your project’s **Environment Variables** (e.g. **Settings → Environment Variables**).
- Use the same Zoom app; no separate “production” app is required for Server-to-Server OAuth.

---

## Quick Reference

- **Zoom Marketplace:** [marketplace.zoom.us](https://marketplace.zoom.us/)
- **Build / Your apps:** [marketplace.zoom.us/user/build](https://marketplace.zoom.us/user/build)
- **Zoom S2S docs:** [developers.zoom.us/docs/internal-apps/s2s-oauth/](https://developers.zoom.us/docs/internal-apps/s2s-oauth/)

Once the three env vars are set and the app is activated with the right scopes, you can schedule and start Zoom meetings from the CRM lead profile → Meetings tab.
