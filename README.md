# 🚘 AutoTrack — Vehicle Maintenance & Repair Log PWA

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square&logo=cloudflare)](https://autotrack-app.pages.dev)
[![React](https://img.shields.io/badge/React-18-cyan?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-purple?style=flat-square&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-orange?style=flat-square&logo=firebase)](https://firebase.google.com)

**AutoTrack** is a modern, offline-capable Progressive Web Application (PWA) designed to track vehicle profiles, service history, maintenance schedules, repair costs, and fluid/filter specifications. It features real-time cloud sync powered by **Google Firebase**, multi-user audit badges, and a **Shared Household Garage** feature that allows families or teams to manage the same vehicle fleet together in real time.

---

## ✨ Features

- 🚘 **Vehicle Garage Management**: Keep detailed profiles for all your cars, trucks, and motorcycles. Store VIN, license plate, current mileage, engine/transmission specs, oil type, filter part numbers, and custom notes.
- 📋 **Comprehensive Service Logs**: Record maintenance procedures (Oil Changes, Brakes, Tires, Battery, Inspections, Repairs) with dates, times, odometer readings, itemized costs, payment types, service providers, and notes.
- ⏰ **Smart Maintenance Reminders**: Stay ahead of service with mileage-based and date-based reminders automatically categorized by urgency (*Overdue*, *Due Soon*, *Good Condition*).
- 📊 **Interactive Financial Analytics**: View cost summaries per vehicle, total lifetime maintenance expenses, and monthly cost breakdowns.
- 👨‍👩‍👧‍👦 **Shared Household Garage Sync**: Real-time cross-device sync via a shared **Household Code** (e.g. `VUONG-FAMILY`). Family members using their own Google account view and update the exact same shared garage seamlessly.
- 👤 **Multi-User Audit Badges**: Automatically tags every vehicle card and service log entry with audit metadata (`👤 Logged by [User]`, `✏️ Edited by [User]`).
- 🔐 **Secure Google OAuth Gate**: Mandatory login screen with account picker ensuring privacy and security across shared devices.
- 💾 **Offline-First & Data Portability**: Works offline with LocalStorage caching. Backup and restore your complete dataset anytime via JSON export/import.
- ⚙️ **Protected Advanced Settings**: Firebase credentials and demo dataset controls are tucked away safely into a lockable, protected Advanced Setup section to prevent accidental changes.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lyvuong/AutoTrack.git
   cd AutoTrack
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   ```

> **Note**: The service worker (`public/sw.js`) only registers in production builds (`import.meta.env.PROD`). It's intentionally skipped in `npm run dev` — its fetch handler caches every same-origin GET request, which would otherwise serve stale cached JS during active development.

---

## 🔥 Setting Up Google Firebase Cloud Sync

AutoTrack works out of the box in **Local Storage / Demo Mode**. To enable **Google Auth**, **Cloud Sync**, and **Real-Time Household Garage Sharing**, set up a free Google Firebase project:

### Step 1: Create a Firebase Project
1. Go to the [Google Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the prompts to name your project (e.g., `my-autotrack-app`).
3. Click **Create project**.

---

### Step 2: Enable Firebase Authentication
1. In your Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, select **Google**.
4. Enable the provider, configure your support email, and click **Save**.
5. Under the **Settings** tab in Authentication, scroll to **Authorized domains**.
   - Add `localhost` (for local development).
   - Add your production deployment domain (e.g., `my-autotrack.pages.dev`).

---

### Step 3: Set Up Cloud Firestore Database
1. In the sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database**, select a database location near you, and choose **Start in production mode**.
3. Go to the **Rules** tab and paste the following security rules to allow authenticated users to access shared garage data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    // 👑 1. Admin Email Allowed to Create New Household Codes
    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.email == 'yourname@gmail.com' // Replace with Admin Email
      );
    }

    // 👥 2. Check if user has entered & registered for the specific household
    function isHouseholdMember(householdCode) {
      return isAuthenticated() && (
        exists(/databases/$(database)/documents/households/$(householdCode)/metadata/info) &&
        request.auth.uid in get(/databases/$(database)/documents/households/$(householdCode)/metadata/info).data.memberUids
      );
    }

    // 🏠 Personal Garage (Users in Personal Mode only access their own data)
    match /users/{userId}/{document=**} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }

    // 🔒 Household Creation & Registration Metadata
    match /households/{householdCode}/metadata/info {
      allow create: if isAdmin();
      allow read, update: if isAuthenticated();
    }

    // 🛡️ Household Vehicles & Service Logs: Restricted ONLY to registered household members!
    match /households/{householdCode}/{subcollection}/{document=**} {
      allow read, write: if isHouseholdMember(householdCode);
    }
  }
}
```
4. Click **Publish**.

---

### Step 4: Set Up Realtime Database (Optional)
If you want instant real-time websocket updates across devices:
1. In the sidebar, navigate to **Build > Realtime Database**.
2. Click **Create database** and select your location.
3. In the **Rules** tab, set:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
4. Click **Publish**.

---

### Step 5: Get Your Web Configuration Credentials
1. Go to **Project Settings** (gear icon near top left) > **General**.
2. Scroll down to **Your apps** and click the **Web icon** (`</>`) to register a web app.
3. Enter an app nickname (e.g., `AutoTrack Web`) and click **Register app**.
4. Copy your `firebaseConfig` keys:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-autotrack-app.firebaseapp.com",
  projectId: "my-autotrack-app",
  storageBucket: "my-autotrack-app.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

---

### Step 6: Connect Credentials to AutoTrack

You can configure credentials using either **Environment Variables** or the **In-App Settings UI**:

#### Method A: Environment Variables (Recommended for Deployed Builds)
Create a `.env` file in the project root directory:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=my-autotrack-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-autotrack-app
VITE_FIREBASE_STORAGE_BUCKET=my-autotrack-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

#### Method B: In-App Settings UI (No Rebuild Required)
1. Open the AutoTrack app in your browser.
2. Click the ⚙️ **Settings** button in the top navigation bar.
3. Scroll down to **Advanced Firebase & Demo Data Controls**.
4. Click `[ 🔓 Unlock to View & Edit ]`.
5. Enter your `API Key` and `Project ID` (plus optional `Auth Domain` and `App ID`), then click **Save Custom Firebase Keys**.

---

## ⚡ Deploying to Cloudflare Pages

AutoTrack is optimized for free, high-performance hosting on **Cloudflare Pages** with automated global CDN deployment.

### Method 1: Git Integration (Recommended for Continuous Deployment)
1. Push your repository to **GitHub** or **GitLab**.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages > Create > Pages > Connect to Git**.
3. Select your `AutoTrack` repository and configure the build settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js Version**: Set environment variable `NODE_VERSION=18` (or higher) under Environment variables.
4. Add your Firebase environment variables under **Environment Variables (advanced)**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **Save and Deploy**. Cloudflare will build and publish your app globally on a `*.pages.dev` subdomain!

---

### Method 2: Command Line Deployment via Wrangler CLI
You can also deploy directly from your local terminal using Cloudflare's **Wrangler CLI**:

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Build the production bundle**:
   ```bash
   npm run build
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy dist --project-name=autotrack-app
   ```

---

### 🌐 Important Cloudflare Configuration Notes

- **`_redirects` File Directive**: AutoTrack includes a `public/_redirects` file that should be left **empty** (or contain comments only). Do not place rule lines like `/* /index.html 200` inside `_redirects`, as Cloudflare Pages will throw a build/deploy error when processing that syntax for Vite SPAs.
- **Firebase Authorized Domains**: After deploying, copy your live Cloudflare URL (e.g. `https://autotrack-app.pages.dev` or custom domain) and add it to **Firebase Console > Authentication > Settings > Authorized Domains** so Google Sign-In functions properly.

---

## 👨‍👩‍👧‍👦 How Shared Household Garage Works

1. **Host Setup**:
   - Open **Settings** > **Shared Family Garage Sync**.
   - Enter a custom Household Code (e.g., `SMITH-GARAGE` or `MY-FAMILY-2026`) and click **Save & Join Household**.
2. **Family Member / Spouse Setup**:
   - Have family members sign in on their own phone or browser with their Google account.
   - Enter the **exact same Household Code** in their Settings.
3. **Instant Real-Time Sync**:
   - All vehicles, service logs, and maintenance reminders created by any family member will sync across devices in real time!
   - Audit badges will show who logged each service (`👤 Logged by [Name]`).

---

## 🧾 Shared `transactions` Ledger (For Other Apps)

Every service log is split across two linked Firestore documents that share the same ID:

- **`records/{id}`** — AutoTrack-specific fields only: `vehicleId`, `mileage`, `category`, `type`, `nextServiceMileage`, `nextServiceDate`, plus audit metadata.
- **`transactions/{id}`** — a generic, app-agnostic ledger entry, stored alongside `records` at the same scope (`users/{uid}/transactions` or `households/{code}/transactions`):

  | Field | Type | Notes |
  |---|---|---|
  | `date` | `string` (`YYYY-MM-DD`) | Service date |
  | `time` | `string` (`HH:MM`) | Time the entry was logged |
  | `amount` | `number` | AutoTrack's "Cost" |
  | `vendor` | `string` | AutoTrack's "Service Provider / Shop Name" |
  | `notes` | `string?` | Free text |
  | `category` | `string` | Free-form; AutoTrack auto-fills `"Car - {ServiceCategory} - {year} - {make} {model}"` |
  | `paymentType` | `'Cash' \| 'Credit Card' \| 'Debit Card' \| 'Bank Transfer' \| 'Check' \| 'Other'` | |
  | `user` | `string` | Display name of whoever logged it |
  | `isTaxDeductible` | `boolean?` | Marks the expense as tax-deductible (auto-set for Registration, Property Tax, and Inspection & Registration) |

Any other app sharing this Firebase project can read/write `transactions` under the same user/household scope without needing to understand vehicles, mileage, or service categories — it's a plain financial ledger. AutoTrack itself joins `records` + `transactions` client-side (matching by shared document ID) to reconstruct the full service log for display.

AutoTrack's vehicle service records (in `records`) and HomeTracker's maintenance records (in `homeRecords`) both join against the same `transactions` collection by shared document ID — so a household's Cost Analytics in either app is reading from one combined ledger without any schema changes.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Build Tool**: Vite 6, SWC
- **Backend & Auth**: Google Firebase (Authentication & Cloud Firestore)
- **Deployment**: Cloudflare Pages, Vercel, Netlify

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
