CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    email TEXT NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND position('@' IN email) > 1),
    password_hash TEXT NOT NULL CHECK (
        password_hash ~ '^scrypt[$]131072[$]8[$]1[$][0-9a-f]{32}[$][0-9a-f]{128}$'
    ),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id, role)
);

CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'admin' CHECK (author_role = 'admin'),
    slug TEXT NOT NULL UNIQUE CHECK (btrim(slug) <> ''),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    summary TEXT NOT NULL CHECK (btrim(summary) <> ''),
    content TEXT NOT NULL CHECK (btrim(content) <> ''),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (author_id, author_role) REFERENCES public.users (id, role) ON DELETE RESTRICT
);

CREATE TABLE public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials (id) ON DELETE RESTRICT,
    slug TEXT NOT NULL UNIQUE CHECK (btrim(slug) <> ''),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    description TEXT NOT NULL CHECK (btrim(description) <> ''),
    entry_node_id UUID,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (NOT is_published OR entry_node_id IS NOT NULL)
);

CREATE TABLE public.chat_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.scenarios (id) ON DELETE RESTRICT,
    node_key TEXT NOT NULL CHECK (btrim(node_key) <> ''),
    title TEXT NOT NULL CHECK (btrim(title) <> ''),
    speaker TEXT NOT NULL CHECK (btrim(speaker) <> ''),
    message TEXT NOT NULL CHECK (btrim(message) <> ''),
    node_type TEXT NOT NULL DEFAULT 'message' CHECK (node_type IN ('message', 'result')),
    outcome TEXT CHECK (outcome IN ('safe', 'recovered', 'risky')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (scenario_id, node_key),
    UNIQUE (id, scenario_id),
    UNIQUE (id, scenario_id, node_type),
    CHECK (
        (node_type = 'message' AND outcome IS NULL) OR
        (node_type = 'result' AND outcome IS NOT NULL)
    )
);

ALTER TABLE public.scenarios ADD CONSTRAINT scenarios_entry_node_fk
    FOREIGN KEY (entry_node_id, id) REFERENCES public.chat_nodes (id, scenario_id)
    DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.chat_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL,
    node_id UUID NOT NULL,
    next_node_id UUID NOT NULL,
    choice_key TEXT NOT NULL CHECK (btrim(choice_key) <> ''),
    label TEXT NOT NULL CHECK (btrim(label) <> ''),
    points INTEGER NOT NULL,
    evaluation TEXT NOT NULL CHECK (btrim(evaluation) <> ''),
    position INTEGER NOT NULL CHECK (position > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (node_id, scenario_id) REFERENCES public.chat_nodes (id, scenario_id) ON DELETE RESTRICT,
    FOREIGN KEY (next_node_id, scenario_id) REFERENCES public.chat_nodes (id, scenario_id) ON DELETE RESTRICT,
    UNIQUE (node_id, choice_key),
    UNIQUE (node_id, position),
    UNIQUE (id, node_id, scenario_id)
);

CREATE TABLE public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
    scenario_id UUID NOT NULL REFERENCES public.scenarios (id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    final_score INTEGER,
    result_node_id UUID,
    result_node_type TEXT NOT NULL DEFAULT 'result' CHECK (result_node_type = 'result'),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    FOREIGN KEY (result_node_id, scenario_id, result_node_type) REFERENCES public.chat_nodes (id, scenario_id, node_type) ON DELETE RESTRICT,
    UNIQUE (id, scenario_id),
    CHECK (
        (status = 'in_progress' AND final_score IS NULL AND result_node_id IS NULL AND completed_at IS NULL) OR
        (status = 'completed' AND final_score IS NOT NULL AND result_node_id IS NOT NULL AND completed_at IS NOT NULL)
    ),
    CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL,
    scenario_id UUID NOT NULL,
    node_id UUID NOT NULL,
    choice_id UUID NOT NULL,
    sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
    choice_label TEXT NOT NULL CHECK (btrim(choice_label) <> ''),
    points_awarded INTEGER NOT NULL,
    evaluation TEXT NOT NULL CHECK (btrim(evaluation) <> ''),
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (attempt_id, scenario_id) REFERENCES public.attempts (id, scenario_id) ON DELETE RESTRICT,
    FOREIGN KEY (choice_id, node_id, scenario_id) REFERENCES public.chat_choices (id, node_id, scenario_id) ON DELETE RESTRICT,
    UNIQUE (attempt_id, sequence_no),
    UNIQUE (attempt_id, node_id)
);

CREATE INDEX materials_author_idx ON public.materials (author_id, author_role);
CREATE INDEX scenarios_material_idx ON public.scenarios (material_id);
CREATE INDEX chat_choices_destination_idx ON public.chat_choices (next_node_id, scenario_id);
CREATE INDEX attempts_user_history_idx ON public.attempts (user_id, started_at DESC);
CREATE INDEX attempts_scenario_idx ON public.attempts (scenario_id);
CREATE INDEX attempts_result_idx ON public.attempts (result_node_id, scenario_id);
CREATE INDEX attempt_answers_choice_idx ON public.attempt_answers (choice_id, node_id, scenario_id);
