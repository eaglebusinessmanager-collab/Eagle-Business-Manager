# Eagle Business Manager

**Eagle Business Manager** is a high-performance, mobile-optimized business management platform and Progressive Web Application (PWA). Built for small and growing enterprises with native **UGX currency** support, real-time inventory tracking, point-of-sale receipt generation, customer ledgers, and a secure multi-store administrative gateway.

---

## 🌟 Founder Attribution
> **MADE WITH LOVE BY EAGLE STYLES (TUSUBIRA BENJAMIN)**  
> **THE FOUNDER OF THE EAGLE ICON MUSIC AND THE EAGLE ICON FOUNDATION AFRICA**

---

## 🚀 Deployment Guide: AI Studio → GitHub → Vercel

This repository is optimized for deployment to **Vercel** with full client-side routing and PWA caching.

### Step 1: Export or Push to GitHub
1. In **Google AI Studio**, open the top menu and select **Export to GitHub** (or download the ZIP file and push to a new GitHub repository).
2. If pushing via Git CLI:
   ```bash
   git init
   git add .
   git commit -m "feat: Eagle Business Manager enterprise release"
   git branch -M main
   git remote add origin https://github.com/your-username/eagle-business-manager.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **"Add New"** → **"Project"**.
3. Import your `eagle-business-manager` GitHub repository.
4. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. (Optional) Add environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`: (Optional cloud database URL)
   - `VITE_SUPABASE_ANON_KEY`: (Optional cloud anon key)
6. Click **Deploy**. Your application will be live in under 60 seconds with SSL and global edge CDN caching!

### Step 3: SPA Routing Support
The included `vercel.json` ensures that all routes rewrite to `/index.html` seamlessly, preventing 404 errors on deep routes and page refreshes.

---

## 🔐 Administrative Security & Roles

### Master Administrator Gateway
- **Access Protocol**: Only accessible via the dedicated **Executive Admin Gateway** tab on the sign-in screen.
- **Cleared Admin Account**:
  - **Email**: `eaglebusinessmanager@gmail.com`
  - **Account Holder**: Eagle Styles (Tusubira Benjamin)
  - **Role**: `admin`
- **Security Protections**:
  - Admin passwords and credentials are never made public or displayed in the interface.
  - Rate limiting & brute-force defense: 5 failed attempts trigger an automatic 60-second cooldown timer.
  - Route guards: Any non-administrative account attempting to access `/admin-*` endpoints is immediately blocked.
  - Tamper-proof audit logging: Every administrative authentication and critical action is recorded in the platform audit trail.

### Merchant Accounts
- Real store owners create their own accounts via **Create Account (Free Tier UGX 0)**.
- Each merchant is isolated to their own business catalog, inventory counts, sales transactions, and customer credit ledger.

---

## 🛠️ Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/eagle-business-manager.git
   cd eagle-business-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run production build**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 📱 Progressive Web App (PWA) Features
- **Offline Mode**: Operates seamlessly offline with indexed client caching.
- **Mobile First**: Android & iOS touch-target optimized bottom navigation bar.
- **Installable**: Supports 1-click home screen installation on Android (Chrome) and iOS (Safari Share → Add to Home Screen).

---

## 📄 License
Created by Eagle Styles (Tusubira Benjamin) — All rights reserved.
