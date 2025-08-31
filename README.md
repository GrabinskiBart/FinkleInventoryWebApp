# Finkle Inventory System

A modern, responsive kitchen inventory management system built with React, TypeScript, and Tailwind CSS. Designed for restaurants and commercial kitchens to track stock levels, manage reorder alerts, and streamline inventory reporting.

## Features

### 🍽️ Restaurant-Focused Design
- **Kitchen-Specific Categories**: Proteins, Produce, Dairy, Pantry, Beverages, Frozen, Spices & Seasonings
- **Visual Category Icons**: Easy identification with emoji-based category system
- **Stock Level Indicators**: Color-coded status (Out of Stock, Low Stock, Well Stocked)

### 📱 Multi-Device Support
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **iPad-Friendly**: Enhanced touch targets and layouts for tablet use
- **Mobile-First**: Ultra-compact mobile interface for quick stock checks

### 👥 Role-Based Access
- **Admin Users**: Full inventory management, automatic stock updates, report review
- **Regular Users**: Stock reporting, view personal reports, limited inventory access
- **Secure Authentication**: Mock authentication system with role-based permissions

### 📊 Comprehensive Reporting
- **Real-Time Stock Updates**: Instant inventory level changes
- **Stock Reports**: Detailed reporting with notes and change tracking
- **Reorder Alerts**: Automatic notifications when items fall below minimum levels
- **Audit Trail**: Complete history of all stock changes and reports

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful backdrop blur effects and transparency
- **Smooth Animations**: Hover states, transitions, and micro-interactions
- **Professional Aesthetics**: Clean, modern design suitable for business use
- **Accessibility**: High contrast ratios and keyboard navigation support

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom utilities
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Database**: Supabase (with localStorage fallback)
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd finkle-inventory-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure Supabase (optional):
   - Create a Supabase project
   - Add your Supabase URL and anon key to `.env`
   - Run the migrations in the `supabase/migrations` folder

5. Start the development server:
```bash
npm run dev
```

## Demo Accounts

The application includes several demo accounts for testing:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `password` | Admin | Full system access |
| `user` | `password` | User | Standard user access |
| `bart` | `password` | User | Kitchen staff member |
| `mae` | `password` | User | Kitchen staff member |
| `angela` | `password` | User | Kitchen staff member |
| `chris` | `password` | User | Kitchen staff member |
| `andre` | `password` | User | Kitchen staff member |
| `akeem` | `password` | User | Kitchen staff member |
| `guest` | `password` | User | Guest access |

## Usage

### For Administrators
1. **Manage Inventory**: Add, edit, and delete inventory items
2. **Set Stock Levels**: Configure minimum and maximum stock thresholds
3. **Review Reports**: Approve or apply user-submitted stock reports
4. **Monitor Alerts**: View reorder alerts and out-of-stock items
5. **Instant Updates**: Admin stock changes are applied immediately

### For Kitchen Staff
1. **Stock Reporting**: Report current stock levels with notes
2. **Quick Counts**: Use mobile-optimized interface for fast stock checks
3. **Track Reports**: View submission history and approval status
4. **Receive Alerts**: See which items need attention

## Database Schema

### Items Table
- Inventory items with stock levels and reorder thresholds
- Automatic reorder flag calculation
- Category-based organization

### Stock Reports Table
- User-submitted stock level reports
- Admin review and approval workflow
- Complete audit trail with timestamps

## Deployment

### Netlify (Recommended)
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Manual Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # React context providers
├── types/              # TypeScript type definitions
├── lib/                # Utility libraries
└── index.css          # Global styles

supabase/
└── migrations/         # Database migration files
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for efficient kitchen inventory management