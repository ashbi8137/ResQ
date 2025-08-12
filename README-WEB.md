# ResQ - Emergency Alert System (Web Version)

## Overview
ResQ is an emergency alert system that allows users to silently notify authorities in emergency situations. This web version is optimized for deployment on Vercel.

## Features
- **Triple-tap Emergency Activation**: Users can trigger emergency alerts by tapping three times
- **GPS Location Sharing**: Automatically shares user's location with authorities
- **Evidence Upload**: Users can upload photos/videos as evidence (web: file picker only)
- **Safe-to-Call Toggle**: Users control whether authorities can call them back
- **Real-time Dashboard**: Authorities can view and manage emergency alerts

## Web-Specific Features
- **Responsive Design**: Works on desktop, tablet, and mobile browsers
- **File Upload**: Users can select photos/videos from their device
- **Location Services**: Uses browser's geolocation API
- **No Vibration**: Vibration feedback is disabled on web (mobile-only feature)

## Deployment to Vercel

### Prerequisites
- Vercel account
- GitHub repository with your code
- Supabase project set up

### Steps to Deploy

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add web support for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   In your Vercel project settings, add these environment variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ktzizjqvuqaknuvnxidi.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eml6anF2dXFha251dm54aWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjM2ODAsImV4cCI6MjA3MDU5OTY4MH0.CXMG1YVq1BPERGviGN_N7ukuqGH4__sQ-Nuj_MmShFU
   ```

4. **Deploy**
   - Vercel will automatically detect the Expo configuration
   - Click "Deploy"
   - Your app will be available at `https://your-project.vercel.app`

### Build Configuration
The project includes:
- `vercel.json`: Vercel deployment configuration
- `package.json`: Build scripts for web export
- Web-optimized components with platform checks

## Local Development

### Start Web Development Server
```bash
npm run web
```

### Build for Production
```bash
npm run build:web
```

## Web Limitations
- **Camera Access**: Camera functionality is not available on web browsers
- **Vibration**: Haptic feedback is mobile-only
- **File Upload**: Limited to file picker (no direct camera capture)
- **Location**: Requires HTTPS and user permission

## Security Notes
- All location data is encrypted and stored securely in Supabase
- User privacy is protected with Row Level Security (RLS)
- No personal information is stored beyond phone number and location
- Evidence files are linked to incident IDs for secure access

## Support
For issues with the web deployment, check:
1. Environment variables are correctly set in Vercel
2. Supabase project is properly configured
3. Browser console for any JavaScript errors
4. Network tab for API request failures

## Mobile vs Web
| Feature | Mobile | Web |
|---------|--------|-----|
| Triple-tap | ✅ | ✅ |
| GPS Location | ✅ | ✅ |
| Camera Capture | ✅ | ❌ |
| File Upload | ✅ | ✅ |
| Vibration | ✅ | ❌ |
| Push Notifications | ✅ | ❌ |

The web version maintains core functionality while adapting to browser limitations.
