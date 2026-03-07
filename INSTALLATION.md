# GoldFlow Pro - Installation & Setup Guide

## Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js 18 or higher** - [Download from nodejs.org](https://nodejs.org/)
- **npm 9 or higher** (comes with Node.js)
- **Git** for version control
- **A Supabase account** - [Create free account at supabase.com](https://supabase.com)

### Step 1: Verify Installation

Open your terminal/command prompt and verify your installation:

```bash
node --version    # Should show v18.0.0 or higher
npm --version     # Should show 9.0.0 or higher
git --version     # Should show git version
```

### Step 2: Clone or Download the Project

```bash
# Using Git (recommended)
git clone <your-repository-url>
cd Angular\ Migration

# Or download the ZIP file and extract it
```

### Step 3: Install Dependencies

```bash
npm install
```

This command will:
- Download all required npm packages
- Install Angular 21 and Material Design
- Install Supabase client and jsPDF libraries
- Set up development dependencies

**Installation typically takes 3-5 minutes depending on your internet speed**

### Step 4: Configure Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign in or create an account
   - Click "New Project"
   - Fill in project details and create

2. **Get Your Credentials**
   - In your Supabase project, go to Settings → API
   - Copy your **Project URL** and **anon public key**

3. **Update Environment Configuration**
   - Open `src/environments/environment.ts`
   - Replace the placeholder values:

   ```typescript
   export const environment = {
     production: false,
     supabase: {
       url: 'YOUR_SUPABASE_URL',  // Paste your URL here
       anonKey: 'YOUR_ANON_KEY'    // Paste your key here
     },
     schema: 'GoldflowDB',
     passphrase: 'GOLD786',
     sessionTimeout: 6 * 60 * 1000
   };
   ```

### Step 5: Create Database Tables

1. **In Supabase Dashboard:**
   - Go to SQL Editor
   - Click "New Query"
   - Copy and paste the following SQL:

```sql
-- Create admin table
CREATE TABLE admin (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  expiry DATE,
  current_stock NUMERIC DEFAULT 0
);

-- Create customer_clients table
CREATE TABLE customer_clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  master_password TEXT,
  current_stock NUMERIC DEFAULT 0
);

-- Create vouchers table
CREATE TABLE vouchers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES customer_clients(id) ON DELETE CASCADE,
  voucher_number INTEGER,
  date DATE,
  opening_stock NUMERIC,
  closing_stock NUMERIC,
  fine_weight NUMERIC,
  gross_weight NUMERIC,
  net_weight NUMERIC,
  mp_gross NUMERIC DEFAULT 0,
  mp_tunch NUMERIC DEFAULT 0,
  mp_fine NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Create voucher_items table
CREATE TABLE voucher_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id uuid REFERENCES vouchers(id) ON DELETE CASCADE,
  description TEXT,
  stamp TEXT,
  gross NUMERIC,
  less NUMERIC,
  tunch NUMERIC,
  wastage NUMERIC,
  pieces INTEGER,
  final_weight NUMERIC
);
```

   - Click "Run" to execute
   - Verify tables appear in the sidebar

### Step 6: Run the Development Server

```bash
npm start
```

This will:
- Start the Angular development server
- Automatically open your browser
- Display the application at `http://localhost:4200`

**You should see the login screen!**

### Step 7: Test Login

Use the default admin credentials:
- **Username:** `admin`
- **Password:** `admin123`
- **Admin Passphrase:** `GOLD786` (for admin panel access)

## Common Issues & Solutions

### Issue: "npm: command not found"

**Solution:** Node.js is not installed or not in PATH
```bash
# Check installation
node --version

# If not found, download and install from https://nodejs.org/
# Then restart your terminal/command prompt
```

### Issue: "Port 4200 is already in use"

**Solution:** Kill the process using port 4200
```bash
# On Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :4200
kill -9 <PID>
```

### Issue: "Cannot find module '@angular/core'"

**Solution:** Dependencies not installed properly
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Supabase connection failed"

**Checklist:**
- ✓ Verify URL and key are correct in `environment.ts`
- ✓ Check Supabase project is active
- ✓ Verify internet connection
- ✓ Check browser console for CORS errors
- ✓ Ensure tables are created in Supabase

### Issue: "Login not working"

**Checklist:**
- ✓ Admin user should auto-seed on first load
- ✓ Check database tables are created
- ✓ Try creating a new customer in Admin panel
- ✓ Clear browser cache and sessionStorage

## Project Navigation

After login, you'll see three main sections:

### 1. **Ledger Tab**
- Create gold transaction vouchers
- Add items with weight calculations
- Automatic PDF receipt generation
- Track stock balance

### 2. **Reports Tab**
- View transaction history
- Filter by date range
- Export reports as PDF
- Summary statistics

### 3. **Admin Tab** (Admin only)
- Create customer accounts
- Set account expiry dates
- Manage customer list
- Delete accounts

## Development Workflow

### Running Tests
```bash
npm test
```

### Build for Production
```bash
npm run build:prod
# Output will be in dist/goldflow-pro/
```

### Check Code Quality
```bash
npm run lint
```

### Watch Mode (Auto-rebuild on changes)
```bash
npm run watch
```

## Directory Structure

```
Angular Migration/
├── src/
│   ├── app/
│   │   ├── core/          # Services & Guards
│   │   ├── features/      # Feature modules
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── environments/      # Config files
│   ├── styles.scss        # Global styles
│   ├── main.ts            # Entry point
│   └── index.html
├── .github/               # GitHub workflows & docs
├── .vscode/               # VS Code settings
├── angular.json           # Angular config
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── README.md              # Project documentation
```

## Deployment Options

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist/goldflow-pro
```

## What's Included

✅ Complete Angular 21 application
✅ Material Design UI components
✅ Supabase database integration
✅ PDF export functionality
✅ Session management & security
✅ Responsive design (mobile, tablet, desktop)
✅ Professional styling with SCSS
✅ Production-ready build configuration

## Next Steps

1. **Customize Branding**
   - Update logo in login component
   - Modify color scheme in `styles.scss`
   - Change application title

2. **Add More Users**
   - Login as admin
   - Go to Admin tab
   - Create customer accounts

3. **Configure for Production**
   - Update `environment.prod.ts`
   - Set up CORS in Supabase
   - Configure database security policies

4. **Deploy**
   - Choose a hosting platform
   - Follow deployment guide for that platform
   - Set up continuous deployment

## Getting Help

- **Documentation**: See README.md
- **Supabase Docs**: https://supabase.com/docs
- **Angular Docs**: https://angular.io/docs
- **Material Design**: https://material.angular.io

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js   | 18.0.0  | 20.x or higher |
| npm       | 9.0.0   | 10.x or higher |
| RAM       | 2GB     | 4GB or more |
| Disk      | 500MB   | 2GB or more |

## Security Notes

⚠️ **Important for Production:**
- Change default admin password immediately
- Use environment variables for API keys
- Enable Supabase Row Level Security (RLS)
- Set up proper CORS policies
- Use HTTPS in production
- Implement rate limiting

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full Support |
| Firefox | 88+     | ✅ Full Support |
| Safari  | 14+     | ✅ Full Support |
| Edge    | 90+     | ✅ Full Support |

---

**Need help?** Check the README.md or .github/copilot-instructions.md for more information!

**Happy coding! 🚀**
