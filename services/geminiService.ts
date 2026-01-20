
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const getStoreSetupSQL = async (): Promise<string> => {
  return `-- 1. Ensure tables exist
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Setup Auto-Confirmation for Local Auth (Fixes "Email not sent" issue)
CREATE OR REPLACE FUNCTION public.handle_local_user_confirm()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users 
  SET confirmed_at = NOW(), 
      email_confirmed_at = NOW() 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up existing trigger if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_confirm') THEN
        DROP TRIGGER on_auth_user_created_confirm ON auth.users;
    END IF;
END $$;

CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_local_user_confirm();

-- 3. Robust Seed Data Script
DO $$
DECLARE
    electronics_id uuid;
    audio_id uuid;
    wearables_id uuid;
BEGIN
    INSERT INTO public.categories (name, slug) 
    VALUES ('Electronics', 'electronics')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO electronics_id;

    INSERT INTO public.categories (name, slug) 
    VALUES ('Audio', 'audio')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO audio_id;

    INSERT INTO public.categories (name, slug) 
    VALUES ('Wearables', 'wearables')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO wearables_id;

    DELETE FROM public.products;

    INSERT INTO public.products (name, description, price, stock, image_url, category_id)
    VALUES 
    ('Quantum Pro Headphones', 'High-fidelity noise cancelling wireless headphones.', 299.99, 50, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', audio_id),
    ('NeoSmart Watch', 'Advanced fitness tracking with 7-day battery life.', 199.00, 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', wearables_id),
    ('Mechanical Keyboard', 'RGB backlit with tactile switches for pro gaming.', 125.50, 100, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80', electronics_id),
    ('UltraWide Monitor', '34-inch curved display for immersive workflow.', 549.99, 15, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80', electronics_id),
    ('Studio Microphone', 'Professional grade condenser mic for streaming.', 150.00, 25, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80', audio_id),
    ('Leather Tech Pouch', 'Organize your cables and chargers in style.', 45.00, 200, 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&q=80', electronics_id);
    
    RAISE NOTICE 'E-commerce store initialized successfully.';
END $$;`;
};

export const getAddProductSQL = (name: string, description: string, price: number, stock: number, imageUrl: string, categoryId: string) => {
  return `INSERT INTO public.products (name, description, price, stock, image_url, category_id)
VALUES ('${name}', '${description}', ${price}, ${stock}, '${imageUrl}', '${categoryId}');`;
};
