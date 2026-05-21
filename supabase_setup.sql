-- 1. PROFILES TABLE (Public profile info linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR PROFILES
CREATE POLICY "Profiles are publicly readable" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 4. TRIGGER FUNCTION FOR NEW SIGNUPS
-- Automatically creates a profile row in public.profiles when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 5) -- Unique username fallback
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER REGISTRATION
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
