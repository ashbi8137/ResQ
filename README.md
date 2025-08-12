# ResQ - Emergency Alert & Communication System

ResQ is a React Native-based emergency alert system designed to help victims of violence, accidents, and disasters silently notify authorities. By tapping three times on a discreet part of the app, users can send a secure alert containing their location, emergency type, and phone number.

## Features

- **Triple Tap Activation**: Silent, discreet SOS trigger
- **GPS Location**: Auto-shared with authorities
- **Phone Number Sharing**: Authority can call only if safe
- **File Upload**: Victim uploads optional media evidence
- **Secure Authority Dashboard**: Incident details, map, call link, media
- **Call Permission Flag**: Victim controls if callback is allowed
- **Real-time Status Updates**: Track alert status (pending → received → in progress → resolved)

## Technology Stack

- **Mobile App**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Location**: React Native Geolocation API
- **File Upload**: Expo Image Picker
- **UI**: React Native with custom components
- **Authentication**: Supabase Auth (ready for future implementation)

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create the necessary tables and functions

### 3. Environment Configuration

The Supabase configuration is already set up in `lib/supabase.ts` with your provided credentials:

```typescript
const supabaseUrl = 'https://ktzizjqvuqaknuvnxidi.supabase.co'
const supabaseAnonKey = 'your-anon-key'
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Project Structure

```
ResQ/
├── app/                    # Expo Router screens
│   └── (tabs)/
│       ├── index.tsx      # Emergency alert screen
│       └── explore.tsx    # Authority dashboard
├── components/            # Reusable components
│   ├── TripleTapAlert.tsx # Main emergency trigger
│   ├── MediaUpload.tsx    # Evidence upload
│   └── AuthorityDashboard.tsx # Authority view
├── lib/                   # Services and utilities
│   ├── supabase.ts       # Supabase client
│   └── emergencyService.ts # Emergency operations
├── supabase-schema.sql   # Database schema
└── README.md
```

## Usage

### For Victims (Emergency Tab)

1. **Trigger Alert**: Tap the red circle 3 times quickly
2. **Select Emergency Type**: Choose from domestic violence, accident, medical, disaster, or other
3. **Set Call Permission**: Indicate if you're safe to receive a callback
4. **Upload Evidence**: Optionally add photos/videos as evidence
5. **Alert Sent**: Authorities receive immediate notification with your location

### For Authorities (Dashboard Tab)

1. **View Alerts**: See all active emergency alerts
2. **Update Status**: Mark alerts as received, in progress, or resolved
3. **Call Victim**: Contact victim if marked as safe to call
4. **View Details**: Access location, emergency type, and uploaded evidence

## Database Schema

### emergency_alerts Table
- `id`: Unique identifier
- `incident_id`: Auto-generated incident ID (RESQ-YYYYMMDD-XXXX)
- `phone_number`: Victim's phone number
- `location_lat/lng`: GPS coordinates
- `emergency_type`: Type of emergency
- `safe_to_call`: Boolean flag for callback permission
- `status`: Alert status (pending/received/in_progress/resolved)
- `media_urls`: Array of uploaded media URLs
- `notes`: Additional notes
- `expires_at`: Auto-expiry after 48 hours

### authority_contacts Table
- Contact information for emergency responders
- Used for SMS/email notifications (future feature)

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Location Privacy**: Only shared when alert is triggered
- **Call Permission**: Victim controls callback availability
- **Data Expiry**: Automatic cleanup after 48 hours
- **Secure API**: Supabase handles authentication and authorization

## Future Enhancements

- [ ] SMS/Email notifications to authorities
- [ ] Real-time location tracking
- [ ] Voice-only fallback calls
- [ ] Wearable device integration
- [ ] AI classification of uploaded media
- [ ] Nearest responder dispatch (geofencing)
- [ ] Anonymous alerts (no personal info)
- [ ] Multi-language support
- [ ] Offline capability
- [ ] Push notifications for status updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the GitHub repository.

---

**Important**: This is a demonstration project. For production use, ensure compliance with local emergency services regulations and implement proper security measures.
