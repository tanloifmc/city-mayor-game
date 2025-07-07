-- City Mayor Game Database Schema
-- This file contains all the SQL commands to set up the database for the City Mayor Game

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    gold INTEGER DEFAULT 1000 NOT NULL,
    land_size_x INTEGER DEFAULT 10 NOT NULL,
    land_size_y INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table (available buildings in marketplace)
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- residential, commercial, public, decoration, entertainment
    cost INTEGER NOT NULL,
    income_per_hour INTEGER DEFAULT 0,
    size_x INTEGER DEFAULT 1,
    size_y INTEGER DEFAULT 1,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_buildings table (buildings placed by users)
CREATE TABLE IF NOT EXISTS public.user_buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_income_collected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, x, y) -- Ensure only one building per position per user
);

-- Create transactions table (for tracking gold transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- purchase, sale, income, expansion
    amount INTEGER NOT NULL, -- positive for income, negative for expenses
    description TEXT,
    building_id UUID REFERENCES public.buildings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create casino_games table (for casino functionality)
CREATE TABLE IF NOT EXISTS public.casino_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- slot_machine, roulette, blackjack
    bet_amount INTEGER NOT NULL,
    result TEXT NOT NULL, -- win, lose, jackpot
    payout INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create music_venue_events table (for music venue functionality)
CREATE TABLE IF NOT EXISTS public.music_venue_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    ticket_price INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    tickets_sold INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casino_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_venue_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Buildings are public (everyone can see all buildings)
CREATE POLICY "Buildings are viewable by everyone" ON public.buildings
    FOR SELECT USING (true);

-- User buildings - users can only see and modify their own buildings
CREATE POLICY "Users can view own buildings" ON public.user_buildings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own buildings" ON public.user_buildings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own buildings" ON public.user_buildings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own buildings" ON public.user_buildings
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions - users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Casino games - users can only see their own games
CREATE POLICY "Users can view own casino games" ON public.casino_games
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own casino games" ON public.casino_games
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Music venue events - users can only see their own events
CREATE POLICY "Users can view own music events" ON public.music_venue_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own music events" ON public.music_venue_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own music events" ON public.music_venue_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample buildings
INSERT INTO public.buildings (name, type, cost, income_per_hour, size_x, size_y, description) VALUES
-- Residential Buildings
('Small House', 'residential', 100, 5, 1, 1, 'A cozy small house for a single family'),
('Apartment Building', 'residential', 500, 30, 2, 2, 'Multi-family apartment building'),
('Luxury Villa', 'residential', 2000, 80, 3, 3, 'Luxurious villa for wealthy residents'),

-- Commercial Buildings
('Corner Shop', 'commercial', 200, 15, 1, 1, 'Small convenience store'),
('Supermarket', 'commercial', 1000, 60, 2, 3, 'Large supermarket serving the community'),
('Shopping Mall', 'commercial', 5000, 200, 4, 4, 'Massive shopping center with multiple stores'),

-- Public Buildings
('Park', 'public', 300, 0, 2, 2, 'Beautiful park that increases nearby property values'),
('School', 'public', 800, 0, 3, 2, 'Educational facility for the community'),
('Hospital', 'public', 1500, 0, 3, 3, 'Medical facility providing healthcare'),
('Police Station', 'public', 1200, 0, 2, 2, 'Ensures safety and reduces crime'),

-- Entertainment Buildings
('Casino', 'entertainment', 3000, 150, 3, 3, 'Gambling establishment that generates high income'),
('Music Venue', 'entertainment', 2500, 100, 3, 2, 'Concert hall for musical performances'),
('Movie Theater', 'entertainment', 1800, 90, 3, 2, 'Cinema for movie entertainment'),

-- Decoration
('Fountain', 'decoration', 150, 0, 1, 1, 'Decorative fountain that beautifies the area'),
('Statue', 'decoration', 250, 0, 1, 1, 'Impressive statue commemorating local history'),
('Garden', 'decoration', 100, 0, 2, 1, 'Beautiful garden with flowers and trees')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_buildings_user_id ON public.user_buildings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_buildings_position ON public.user_buildings(user_id, x, y);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_games_user_id ON public.casino_games(user_id);
CREATE INDEX IF NOT EXISTS idx_music_venue_events_user_id ON public.music_venue_events(user_id);

-- Create a function to calculate income for a user
CREATE OR REPLACE FUNCTION calculate_user_income(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_income INTEGER := 0;
    building_record RECORD;
    hours_since_last_collection NUMERIC;
BEGIN
    FOR building_record IN
        SELECT ub.*, b.income_per_hour, ub.last_income_collected
        FROM public.user_buildings ub
        JOIN public.buildings b ON ub.building_id = b.id
        WHERE ub.user_id = user_uuid AND b.income_per_hour > 0
    LOOP
        -- Calculate hours since last collection
        hours_since_last_collection := EXTRACT(EPOCH FROM (NOW() - building_record.last_income_collected)) / 3600;
        
        -- Add income (max 24 hours worth)
        total_income := total_income + (building_record.income_per_hour * LEAST(hours_since_last_collection, 24));
    END LOOP;
    
    RETURN FLOOR(total_income);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to collect income for a user
CREATE OR REPLACE FUNCTION collect_user_income(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    income_amount INTEGER;
BEGIN
    -- Calculate income
    income_amount := calculate_user_income(user_uuid);
    
    IF income_amount > 0 THEN
        -- Update user gold
        UPDATE public.users 
        SET gold = gold + income_amount 
        WHERE id = user_uuid;
        
        -- Update last collection time for all buildings
        UPDATE public.user_buildings 
        SET last_income_collected = NOW() 
        WHERE user_id = user_uuid;
        
        -- Record transaction
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (user_uuid, 'income', income_amount, 'Collected building income');
    END IF;
    
    RETURN income_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

