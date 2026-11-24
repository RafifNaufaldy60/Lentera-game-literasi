CREATE TABLE public.user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX user_sessions_expire_idx ON public.user_sessions (expire);
