-- Perluasan aditif. Tidak mengubah migrasi 001/002 atau menghapus data permainan lama.
ALTER TABLE public.scenarios
  ADD COLUMN play_mode text NOT NULL DEFAULT 'chat' CHECK (play_mode IN ('chat','email','social','privacy','market','hybrid')),
  ADD COLUMN chapter_number integer NOT NULL DEFAULT 1 CHECK (chapter_number BETWEEN 1 AND 5),
  ADD COLUMN difficulty text NOT NULL DEFAULT 'pemula' CHECK (difficulty IN ('pemula','menengah','lanjutan')),
  ADD COLUMN estimated_minutes integer NOT NULL DEFAULT 5 CHECK (estimated_minutes BETWEEN 1 AND 45);

ALTER TABLE public.chat_nodes
  ADD COLUMN scene_type text NOT NULL DEFAULT 'chat' CHECK (scene_type IN ('chat','email','social','privacy','market','system')),
  ADD COLUMN meta jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(meta) = 'object');

CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_key text NOT NULL DEFAULT 'orbit' CHECK (avatar_key IN ('orbit','pixel','spark','shield')),
  sound_enabled boolean NOT NULL DEFAULT FALSE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.badge_definitions (
  badge_key text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon_key text NOT NULL,
  accent text NOT NULL
);
CREATE TABLE public.user_badges (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL REFERENCES public.badge_definitions(badge_key) ON DELETE RESTRICT,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);
CREATE INDEX user_badges_awarded_idx ON public.user_badges (user_id, awarded_at DESC);

INSERT INTO public.badge_definitions (badge_key,title,description,icon_key,accent) VALUES
 ('first-step','Langkah Pertama','Selesaikan satu misi keamanan digital.','flag','coral'),
 ('phishing-eye','Detektif Pesan','Selesaikan misi phishing dengan skor minimal 70.','search','yellow'),
 ('kind-heart','Pembela Teman','Selesaikan misi cyberbullying dengan skor minimal 70.','heart','pink'),
 ('privacy-keeper','Penjaga Privasi','Selesaikan misi doxing dengan skor minimal 70.','lock','mint'),
 ('smart-shopper','Pembeli Cermat','Selesaikan misi penipuan belanja dengan skor minimal 70.','shopping-bag','sky'),
 ('high-score','Keputusan Cemerlang','Raih 90 poin atau lebih dalam satu misi.','star','yellow'),
 ('four-topics','Penjelajah Digital','Selesaikan setidaknya satu misi pada masing-masing dari empat topik.','compass','sky'),
 ('final-guardian','Pelindung Digital','Tuntaskan misi final Digital Crisis.','shield','mint')
ON CONFLICT (badge_key) DO NOTHING;

UPDATE public.scenarios SET chapter_number = CASE slug
 WHEN 'paket-tertahan' THEN 1 WHEN 'grup-kelas-mengejek-teman' THEN 2
 WHEN 'alamat-tersebar-di-komunitas' THEN 3 WHEN 'flash-sale-toko-palsu' THEN 4
 ELSE chapter_number END,
 play_mode = CASE slug
 WHEN 'paket-tertahan' THEN 'email' WHEN 'grup-kelas-mengejek-teman' THEN 'social'
 WHEN 'alamat-tersebar-di-komunitas' THEN 'privacy' WHEN 'flash-sale-toko-palsu' THEN 'market'
 ELSE play_mode END
WHERE slug IN ('paket-tertahan','grup-kelas-mengejek-teman','alamat-tersebar-di-komunitas','flash-sale-toko-palsu');
