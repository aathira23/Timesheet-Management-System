# Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5174**

---

## 🔑 Test Accounts

Use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| **Employee** | `employee@company.com` | `password123` |
| **Manager** | `manager@company.com` | `password123` |
| **Admin** | `admin@company.com` | `password123` |

---

## 📱 Demo Flow

### Employee Journey:
1. Login with employee credentials
2. View personal timesheet stats
3. See recent timesheets
4. Browse assigned projects
5. Access quick actions (add timesheet, calendar)

### Manager Journey:
1. Login with manager credentials
2. View team statistics
3. Approve/Reject pending timesheets
4. Monitor team analytics
5. Check team member hours

### Admin Journey:
1. Login with admin credentials
2. View system-wide metrics
3. Monitor user activity logs
4. Access recent reports
5. Use quick admin actions

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── contexts/           # React Context
│   ├── routes/             # Route definitions
│   ├── services/           # API services
│   ├── styles/             # Global styles
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎯 Key Features

✅ **Role-Based Access**
- Automatic dashboard selection based on user role
- Protected routes

✅ **Modern UI**
- Clean, professional design
- Responsive layout
- Smooth animations

✅ **Mock Data**
- Ready for backend integration
- Easy to replace with real API calls

✅ **TypeScript**
- Full type safety
- Improved developer experience

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 📚 File Reference

### Pages
- `pages/Login.tsx` - Login interface
- `pages/EmployeeDashboard.tsx` - Employee home
- `pages/ManagerDashboard.tsx` - Manager home
- `pages/AdminDashboard.tsx` - Admin home
- `pages/Timesheet.tsx` - Timesheet management
- `pages/Projects.tsx` - Project list
- `pages/Reports.tsx` - Reports view
- `pages/CalendarView.tsx` - Calendar interface

### Components
- `components/layout/Layout.tsx` - Main layout wrapper
- `components/layout/Header.tsx` - Top navigation bar
- `components/layout/Sidebar.tsx` - Side navigation

### Context & Services
- `contexts/AuthContext.tsx` - Authentication state
- `services/api.ts` - API client
- `routes/AppRoutes.tsx` - Route definitions

---

## 🎨 Customization

### Change Colors
Edit `src/styles/theme.css`:
```css
:root {
  --primary-600: #0284c7;      /* Change primary color */
  --success: #10b981;          /* Change success color */
  --danger: #ef4444;           /* Change danger color */
}
```

### Change Logo
Edit `src/components/layout/Sidebar.tsx`:
```tsx
<div className="sidebar-logo-icon">
  {/* Replace Clock icon */}
  <YourIcon size={24} />
</div>
```

### Update Brand Name
Edit `src/components/layout/Sidebar.tsx`:
```tsx
<h2 className="sidebar-logo">Your App Name</h2>
```

---

## 🔌 Backend Integration

1. **Replace Mock Login**
   - Edit `src/contexts/AuthContext.tsx`
   - Call your backend `/auth/login` endpoint

2. **Add Real Data**
   - Replace dashboard mock data with API calls
   - Use services in `src/services/`

3. **Configure API URL**
   - Create `.env` file
   - Set `VITE_API_URL=your-api-url`

See `INTEGRATION_GUIDE.md` for detailed steps.

---

## 📊 Component Overview

### Dashboard Components
- **StatCard** - Shows key metrics
- **QuickActions** - Action buttons
- **ListItem** - Table-like lists
- **StatusBadge** - Status indicators

### Layout Components
- **Header** - Navigation with profile dropdown
- **Sidebar** - Role-based menu
- **Layout** - Main wrapper

---

## 🐛 Debugging

### Enable React DevTools
```bash
npm install react-devtools
```

### Check Console
- Open browser DevTools (F12)
- Go to Console tab
- Look for errors/warnings

### Common Issues
- **Port already in use**: Use `npm run dev -- --port 3000`
- **Module not found**: Run `npm install` again
- **Styling not applied**: Clear browser cache

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| react | UI library |
| react-router-dom | Routing |
| react-calendar | Calendar widget |
| lucide-react | Icons |
| vite | Build tool |
| typescript | Type safety |

---

## 🚀 Production Deployment

```bash
# Build production version
npm run build

# Deploy dist/ folder to your hosting:
# - Vercel: drag & drop dist/
# - Netlify: connect GitHub
# - AWS S3: aws s3 sync dist/ s3://bucket-name
```

---

## 📞 Support

- Check `PROJECT_SUMMARY.md` for features overview
- Check `INTEGRATION_GUIDE.md` for backend integration
- Review component files for implementation details

---

## ✅ Checklist Before Deployment

- [ ] Environment variables configured
- [ ] Backend API endpoints ready
- [ ] Database migrations completed
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Form validation in place
- [ ] Responsive design tested
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] CORS properly set up

---

**Happy coding! 🎉**