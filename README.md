# GoldFlow Pro - Angular 21 Migration

A professionally designed Gold Ledger & Inventory Management System built with Angular 21 and Material Design.

## Features

✨ **Complete Feature Set**
- User authentication with role-based access (Admin & Customer)
- Gold transaction voucher creation and management
- Real-time weight calculations (gross, net, fine weight)
- PDF receipt generation for transactions
- Comprehensive reporting with date-range filtering
- Customer/Client account management
- Admin panel for user and account management
- Session management with inactivity auto-logout
- Responsive Material Design UI
- Professional color scheme with proper contrast

## Tech Stack

- **Frontend Framework**: Angular 21 (Standalone Components)
- **UI Library**: Angular Material Design
- **Styling**: SCSS with CSS Variables
- **Backend**: Supabase (PostgreSQL)
- **PDF Generation**: jsPDF with AutoTable
- **State Management**: RxJS Observables
- **Routing**: Angular Router with Guards

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── supabase.service.ts          # Supabase database operations
│   │   │   ├── session.service.ts           # Session & authentication management
│   │   │   └── pdf-export.service.ts        # PDF generation service
│   │   └── guards/
│   │       └── auth.guard.ts                # Route authorization guards
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/                       # Login component
│   │   ├── dashboard/
│   │   │   └── dashboard/                   # Main dashboard with navigation
│   │   ├── ledger/
│   │   │   └── ledger.component.ts          # Voucher entry component
│   │   ├── reports/
│   │   │   └── reports.component.ts         # Report generation component
│   │   └── admin/
│   │       └── admin.component.ts           # Admin panel component
│   ├── app.component.ts                     # Root component
│   └── app.routes.ts                        # Route configuration
├── environments/
│   ├── environment.ts                       # Development config
│   └── environment.prod.ts                  # Production config
├── styles.scss                              # Global styles & theme
└── main.ts                                  # Bootstrap file
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Angular CLI 21
- Supabase account (for backend)

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Angular 21 and Material Design
- Supabase JS Client
- jsPDF and jsPDF-AutoTable
- RxJS for reactive programming

### Step 2: Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Update the credentials in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_ANON_KEY'
  },
  // ... rest of config
};
```

### Step 3: Database Setup

Create the following tables in your Supabase database:

**admin** table
```sql
CREATE TABLE admin (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
```

**customers** table
```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  expiry DATE,
  current_stock NUMERIC DEFAULT 0
);
```

**customer_clients** table
```sql
CREATE TABLE customer_clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id),
  name TEXT NOT NULL,
  master_password TEXT,
  current_stock NUMERIC DEFAULT 0
);
```

**vouchers** table
```sql
CREATE TABLE vouchers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id),
  client_id uuid REFERENCES customer_clients(id),
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
```

**voucher_items** table
```sql
CREATE TABLE voucher_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id uuid REFERENCES vouchers(id),
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

## Running the Application

### Development Server

```bash
npm start
```

The application will open automatically in your browser at `http://localhost:4200`

### Build for Production

```bash
npm run build:prod
```

Output files will be in the `dist/goldflow-pro` directory.

## Default Credentials

For testing purposes:
- **Admin User**: username: `admin` password: `admin123`
- **Admin Passphrase**: `GOLD786` (for locked admin panel)

## Usage Guide

### For Customers

1. **Login**: Enter your credentials (or ask admin to create an account)
2. **Create Voucher**: Go to Ledger tab
   - Select a client account
   - Add items with details (weight, purity, etc.)
   - System auto-calculates fine weight
   - Add makeup payment deduction if needed
   - Save voucher (auto-generates PDF receipt)
3. **View Reports**: Go to Reports tab
   - Select date range
   - View transaction history
   - Export data as PDF

### For Admins

1. **Login**: Use admin credentials
2. **Create Customers**: Go to Admin tab
   - Unlock with passphrase (`GOLD786`)
   - Create new customer accounts with expiry dates
3. **Manage Accounts**: View all customers
   - Update expiry dates
   - Delete accounts if needed

## Features in Detail

### 🔐 Security
- Session-based authentication stored in sessionStorage
- Inactivity auto-logout (6 minutes default)
- Role-based access control (Admin/Customer)
- Password-protected admin panel
- Account expiry enforcement

### 📊 Calculations
- **Fine Weight**: `(Gross - Less) × (100 - Tunch%) × (100 - Wastage%)`
- **Net Weight**: `Gross - Less`
- **Closing Balance**: `Opening + Fine Weight - MP Fine`
- All calculations in grams (g) for precision

### 📄 PDF Generation
- Professional receipt format with company branding
- Detailed transaction information
- Weight calculations breakdown
- Automatic file naming with date
- Landscape reports for comprehensive views

### 🎨 UI/UX
- Material Design components throughout
- Responsive design (works on mobile, tablet, desktop)
- Professional color scheme (Indigo & Gold)
- Smooth animations and transitions
- Accessibility-friendly design

## Mobile Responsiveness

The application is fully responsive:
- **Desktop**: Full feature display with optimized layouts
- **Tablet**: Adjusted grid layouts maintaining readability
- **Mobile**: Single-column layout with touch-friendly buttons

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimizations

- Lazy-loaded feature modules
- Standalone components (reduced bundle size)
- OnPush change detection strategy
- Optimized Material imports
- Tree-shaking enabled

## Troubleshooting

### Common Issues

**Supabase Connection Failed**
- Check SUPABASE_URL and ANON_KEY in environment.ts
- Verify Supabase project is active
- Check browser console for CORS errors

**Login Not Working**
- Ensure admin user exists (auto-seeded on first load)
- Check customer account hasn't expired
- Clear browser cache and sessionStorage

**PDF Generation Issues**
- Check browser has sufficient memory
- Reduce number of items in voucher if needed
- Update jsPDF package if having rendering issues

**Styling Not Applied**
- Clear browser cache
- Rebuild project: `ng build`
- Check that material CSS is loaded in index.html

## Development Guide

### Adding New Features

1. Create component in appropriate feature folder
2. Add component to route in `app.routes.ts`
3. Use existing services (Supabase, Session, PdfExport)
4. Style with SCSS using CSS variables
5. Test on mobile, tablet, and desktop

### Code Style

- Use TypeScript strict mode
- Follow Angular style guide
- Document public methods
- Use descriptive variable names
- Handle errors gracefully

## Deployment

### To Vercel
```bash
npm install -g vercel
vercel
```

### To Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

### To Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## Environment Variables

The application uses environment files for configuration. Create a `.env` file in the root:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## Version History

- **v1.0.0** (2026-03-07): Initial Angular 21 Migration
  - Complete feature parity with original app
  - Professional Material Design UI
  - Enhanced responsive design
  - Improved performance

## License

This project is proprietary. All rights reserved.

## Support

For issues or feature requests, contact the development team.

---

**Built with ❤️ using Angular 21 and Material Design**
