# BillScan — Professional Website

Two-page SaaS site + secure backend.

## Files
- index.html   → landing page (your marketing front)
- app.html      → the actual tool
- api/scan.js   → hidden backend (your API key lives here, safely)
- vercel.json   → config

## Deploy (15 minutes)

### 1. Get API key
- console.anthropic.com → API Keys → Create Key
- Billing → add $5 credit

### 2. Put on GitHub
- github.com → New repository → name "billscan"
- Upload ALL files (index.html, app.html, api folder, vercel.json)

### 3. Deploy on Vercel
- vercel.com → sign up with GitHub → Add New Project
- Import "billscan" repo
- Click "Environment Variables" BEFORE deploy:
  - Name:  ANTHROPIC_API_KEY
  - Value: your key
- Deploy → get link like billscan.vercel.app

### 4. Share
- Send link on WhatsApp → people open → upload photo → get bill
- Key never visible to anyone

## Notes
- Landing page = index.html (opens first)
- "Open App" button → app.html (the tool)
- Same secure backend as before
- API cost ~₹0.35 per single-page scan, $5 = ~1,400 bills
