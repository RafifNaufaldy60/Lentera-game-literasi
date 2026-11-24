-- Toko kosmetik Lentera PLAY. Aditif, tidak menghapus data percobaan.
CREATE TABLE public.shop_items (
  id text PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9-]{2,59}$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 3 AND 80),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 8 AND 240),
  category text NOT NULL CHECK (category IN ('frame','chat','companion','background','title','stickers')),
  asset_key text NOT NULL CHECK (asset_key IN ('frame','chat','companion','background','nameplate','stickers')),
  price integer NOT NULL CHECK (price BETWEEN 0 AND 100000),
  accent text NOT NULL DEFAULT 'cyan' CHECK (accent IN ('cyan','violet','pink','gold','mint')),
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shop_items_category_active_idx ON public.shop_items (category, is_active);

CREATE TABLE public.coin_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coin_reward_progress (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE RESTRICT,
  best_score integer NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  coins_awarded integer NOT NULL CHECK (coins_awarded >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scenario_id)
);
CREATE TABLE public.coin_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount <> 0),
  kind text NOT NULL CHECK (kind IN ('mission','purchase')),
  attempt_id uuid REFERENCES public.attempts(id) ON DELETE RESTRICT,
  item_id text REFERENCES public.shop_items(id) ON DELETE RESTRICT,
  description text NOT NULL CHECK (length(btrim(description)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coin_transactions_origin_check CHECK (
    (kind='mission' AND amount > 0 AND attempt_id IS NOT NULL AND item_id IS NULL) OR
    (kind='purchase' AND amount < 0 AND attempt_id IS NULL AND item_id IS NOT NULL)
  )
);
CREATE INDEX coin_transactions_user_time_idx ON public.coin_transactions (user_id,created_at DESC,id DESC);
CREATE UNIQUE INDEX coin_transactions_mission_once_idx ON public.coin_transactions (user_id,attempt_id) WHERE kind='mission';
CREATE UNIQUE INDEX coin_transactions_purchase_once_idx ON public.coin_transactions (user_id,item_id) WHERE kind='purchase';

CREATE TABLE public.user_inventory (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.shop_items(id) ON DELETE RESTRICT,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,item_id)
);
CREATE TABLE public.user_equipment (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('frame','chat','companion','background','title','stickers')),
  item_id text NOT NULL,
  equipped_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,slot),
  -- Foreign key ensures equipment cannot point to someone else's inventory.
  FOREIGN KEY (user_id,item_id) REFERENCES public.user_inventory(user_id,item_id) ON DELETE RESTRICT
);
CREATE INDEX user_inventory_recent_idx ON public.user_inventory (user_id,acquired_at DESC);
