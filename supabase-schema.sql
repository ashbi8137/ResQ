-- Create emergency_alerts table
CREATE TABLE emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  phone_number TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN ('domestic_violence', 'accident', 'disaster', 'medical', 'other')),
  safe_to_call BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'in_progress', 'resolved')),
  incident_id TEXT UNIQUE NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Create authority_contacts table
CREATE TABLE authority_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create RLS (Row Level Security) policies
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE authority_contacts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to emergency_alerts (for dashboard)
CREATE POLICY "Allow public read access to emergency_alerts" ON emergency_alerts
  FOR SELECT USING (true);

-- Allow public insert access to emergency_alerts (for app)
CREATE POLICY "Allow public insert access to emergency_alerts" ON emergency_alerts
  FOR INSERT WITH CHECK (true);

-- Allow public update access to emergency_alerts (for status updates)
CREATE POLICY "Allow public update access to emergency_alerts" ON emergency_alerts
  FOR UPDATE USING (true);

-- Allow public read access to authority_contacts
CREATE POLICY "Allow public read access to authority_contacts" ON authority_contacts
  FOR SELECT USING (is_active = true);

-- Insert some sample authority contacts
INSERT INTO authority_contacts (name, phone_number, email, department) VALUES
  ('Emergency Dispatch', '+1234567890', 'dispatch@emergency.gov', 'Emergency Services'),
  ('Local Police', '+1234567891', 'police@local.gov', 'Law Enforcement'),
  ('Fire Department', '+1234567892', 'fire@local.gov', 'Fire Services');

-- Create function to generate incident ID
CREATE OR REPLACE FUNCTION generate_incident_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RESQ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate incident_id
CREATE OR REPLACE FUNCTION set_incident_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.incident_id IS NULL THEN
    NEW.incident_id := generate_incident_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_incident_id
  BEFORE INSERT ON emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION set_incident_id();
