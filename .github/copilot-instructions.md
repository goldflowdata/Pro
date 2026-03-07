# GoldFlow Pro - Angular 21 Project Setup Guide

## Setup Checklist Tracking

This document tracks the setup and migration process for the GoldFlow Pro Angular 21 application.

### Completed Steps

- [x] Clarify Project Requirements
  - Angular 21 migration from vanilla JavaScript
  - Material Design professional UI
  - Full Supabase integration
  - Production-ready architecture
  - All original features preserved

- [x] Scaffold the Project
  - Created package.json with Angular 21 dependencies
  - Generated angular.json configuration
  - Set up TypeScript configuration files
  - Created project folder structure

- [x] Create Core Services & Guards
  - Supabase service with database operations
  - Session & authentication service with inactivity tracking
  - PDF export service for voucher generation
  - Auth guard for route protection

- [x] Implement Authentication
  - Login component with Material UI
  - Session management (sessionStorage)
  - Role-based access (Admin/Customer)
  - Inactivity auto-logout (6 minutes)
  - Account expiry enforcement

- [x] Build Dashboard & Navigation
  - Main dashboard with tab-based navigation
  - Material toolbar with user menu
  - Dynamic tab visibility based on role
  - Professional styling with responsive design

- [x] Develop Ledger Feature
  - Voucher creation with item management
  - Real-time weight calculations
  - Makeup payment (MP) deduction
  - Stock balance tracking
  - PDF receipt generation on save

- [x] Create Reports Module
  - Date-range filtering for transactions
  - Summary cards with key metrics
  - Voucher list with detailed information
  - PDF export functionality for reports

- [x] Build Admin Panel
  - Customer account creation
  - Expiry date management
  - Account deletion with cascade
  - Passphrase-protected access
  - Customer grid view with status indicators

- [x] Implement Global Styling
  - CSS variables for theming
  - Professional color palette (Indigo & Gold)
  - Responsive design breakpoints
  - Material Design integration
  - SCSS modular organization

- [x] Configure Routing
  - Lazy-loaded feature modules
  - Route guards for protected pages
  - Redirect logic based on user role
  - 404 handling

### Features Implemented

✅ **User Authentication**
- Admin and Customer roles
- Login with password validation
- Session persistence
- Inactivity auto-logout
- Account expiry dates

✅ **Ledger Management**
- Create gold vouchers with multiple items
- Calculate fine, gross, and net weights
- Track stock balances
- Apply makeup payment deductions
- Generate PDF receipts automatically

✅ **Reporting**
- Filter transactions by date range
- View transaction history
- Export reports as PDF
- Summary statistics
- Detailed voucher information

✅ **Admin Panel**
- Create customer accounts
- Set account expiry dates
- Manage customer list
- Delete accounts
- Security with passphrase

✅ **Professional UI**
- Material Design components
- Responsive layouts
- Professional color scheme
- Smooth animations
- Mobile-friendly design

## Installation Steps

### 1. Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- Modern web browser

### 2. Install Node.js
Download and install from: https://nodejs.org/

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Supabase
Update `src/environments/environment.ts` with your Supabase credentials:
```typescript
supabase: {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_ANON_KEY'
}
```

### 5. Create Database Tables
Execute the SQL scripts in your Supabase dashboard:
- admin
- customers
- customer_clients
- vouchers
- voucher_items

See README.md for complete table schemas.

### 6. Run Development Server
```bash
npm start
```
Application opens at http://localhost:4200

### 7. Default Credentials
- Admin: username=`admin`, password=`admin123`
- Admin Passphrase: `GOLD786`

## Build for Production

```bash
npm run build:prod
```

Output in: `dist/goldflow-pro/`

## Project Structure Overview

```
src/
├── app/
│   ├── core/
│   │   ├── services/        (Supabase, Session, PDF)
│   │   └── guards/          (Auth guard)
│   ├── features/
│   │   ├── auth/            (Login component)
│   │   ├── dashboard/       (Main layout)
│   │   ├── ledger/          (Voucher entry)
│   │   ├── reports/         (Reports view)
│   │   └── admin/           (Admin panel)
│   ├── app.component.ts     (Root component)
│   └── app.routes.ts        (Routing config)
├── environments/            (Config files)
├── styles.scss             (Global styles)
└── main.ts                 (Bootstrap)
```

## Key Features and Implementations

### Services
- **Supabase Service**: Database operations, user management
- **Session Service**: Authentication, session tracking, inactivity timeout
- **PDF Export Service**: Receipt and report generation

### Components
- **Login**: Authentication interface with Material forms
- **Dashboard**: Main layout with tab navigation
- **Ledger**: Voucher creation and item management
- **Reports**: Transaction history and analysis
- **Admin**: User account management

### Styling
- CSS variables for consistent theming
- SCSS nesting and organization
- Material Design integration
- Responsive breakpoints at 1024px, 768px, 480px

## Testing Credentials

### Admin Access
- Username: `admin`
- Password: `admin123`
- Passphrase: `GOLD786`

### Creating Test Customers
1. Login as admin
2. Go to Admin tab (reports area shows admin option if logged in as admin)
3. Enter passphrase
4. Create customer accounts for testing

## Development Notes

### Technology Stack
- Angular 21 (Standalone components)
- Angular Material 21
- Supabase JS Client
- jsPDF with AutoTable
- TypeScript 5.5
- SCSS with CSS Variables
- RxJS 7.8

### Performance Optimizations
- Lazy loading of feature modules
- Standalone components
- OnPush change detection (where applicable)
- Tree-shaking enabled
- Production builds with optimization

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules`
- Try again: `npm install`

### Application won't start
- Check Node.js is installed: `node --version`
- Check port 4200 is available
- Clear Angular cache: `ng cache clean`

### Supabase connection errors
- Verify credentials in environment.ts
- Check Supabase project is active
- Check network connectivity
- Review browser console for CORS errors

### Database errors
- Ensure all tables are created
- Verify RLS policies allow operations
- Check Supabase credentials have proper permissions

## Next Steps for Production

1. **Environment Configuration**
   - Set up environment.prod.ts with production Supabase URL
   - Configure CORS properly in Supabase
   - Set up authentication policies

2. **Database Security**
   - Implement Row Level Security (RLS) policies
   - Set up proper role-based access
   - Enable audit logging

3. **Deployment**
   - Choose hosting platform (Vercel, Firebase, Netlify, AWS)
   - Configure build process
   - Set up CI/CD pipeline

4. **Monitoring**
   - Set up error tracking
   - Add analytics
   - Monitor performance metrics

5. **Backup & Recovery**
   - Set up automated Supabase backups
   - Test recovery procedures
   - Document disaster recovery plan

## Support & Maintenance

### Regular Maintenance
- Keep dependencies updated: `npm update`
- Run security audit: `npm audit`
- Monitor performance metrics
- Review error logs

### Common Updates
- Angular updates: Major version yearly
- Material Design: Follows Angular version
- Supabase: Updates as needed, check changelog

---

**Last Updated**: March 7, 2026
**Angular Version**: 21.0.0
**Status**: Production Ready
