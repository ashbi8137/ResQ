# Deploy ResQ to Vercel - Step by Step Guide

## 🚀 Quick Deployment

### Step 1: Prepare Your Repository
Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Add web support for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"New Project"**
4. Import your GitHub repository
5. Vercel will automatically detect it's an Expo project
6. Click **"Deploy"**

### Step 3: Configure Environment Variables (Optional)
If you want to use environment variables instead of hardcoded values:

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add these variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ktzizjqvuqaknuvnxidi.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eml6anF2dXFha251dm54aWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjM2ODAsImV4cCI6MjA3MDU5OTY4MH0.CXMG1YVq1BPERGviGN_N7ukuqGH4__sQ-Nuj_MmShFU
   ```

### Step 4: Your App is Live! 🎉
Your ResQ app will be available at: `https://your-project-name.vercel.app`

## 🔧 What's Included

### Web-Optimized Features:
- ✅ **Triple-tap Emergency Activation** (works with mouse clicks)
- ✅ **GPS Location Sharing** (uses browser geolocation)
- ✅ **Evidence Upload** (file picker for photos/videos)
- ✅ **Safe-to-Call Toggle**
- ✅ **Emergency Dashboard** for authorities
- ✅ **Responsive Design** (works on all devices)

### Web Limitations:
- ❌ **Camera Capture** (not available in browsers)
- ❌ **Vibration Feedback** (mobile-only feature)
- ❌ **Push Notifications** (mobile-only feature)

## 🧪 Test Your Deployment

1. **Emergency Alert**: Select incident type, toggle safe-to-call, click "SEND ALERT" three times
2. **Location**: Allow location access when prompted
3. **Evidence Upload**: After sending alert, click "+ Add Photo/Video" to upload evidence
4. **Dashboard**: Go to the "Dashboard" tab to view emergency alerts

## 🔍 Troubleshooting

### Common Issues:
1. **Location not working**: Make sure you're using HTTPS and allow location access
2. **Upload not working**: Check browser console for errors
3. **Build fails**: Ensure all dependencies are installed

### Check Logs:
- Vercel deployment logs in your project dashboard
- Browser console for JavaScript errors
- Network tab for API failures

## 📱 Mobile vs Web Comparison

| Feature | Mobile App | Web App |
|---------|------------|---------|
| Triple-tap | ✅ Physical taps | ✅ Mouse clicks |
| GPS Location | ✅ Native API | ✅ Browser API |
| Camera | ✅ Direct access | ❌ File picker only |
| File Upload | ✅ Camera + Gallery | ✅ File picker |
| Vibration | ✅ Haptic feedback | ❌ Not available |
| Push Notifications | ✅ Native | ❌ Not available |
| Offline Support | ✅ PWA possible | ❌ Requires internet |

## 🎯 Next Steps

After deployment, consider:
1. **Custom Domain**: Add your own domain in Vercel settings
2. **Analytics**: Add Google Analytics or Vercel Analytics
3. **PWA**: Make it installable as a Progressive Web App
4. **SMS/Email Integration**: Add Twilio for real notifications
5. **Enhanced Security**: Add authentication and user accounts

## 📞 Support

If you encounter issues:
1. Check the [README-WEB.md](./README-WEB.md) for detailed documentation
2. Review Vercel deployment logs
3. Test locally with `npm run web` first
4. Ensure Supabase is properly configured

Your ResQ emergency alert system is now ready for web deployment! 🚨
