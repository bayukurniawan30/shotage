create table if not exists "oauth_clients" (
  "client_id" text primary key not null,
  "client_name" text not null,
  "redirect_uris" jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists "oauth_authorization_codes" (
  "code_hash" text primary key not null,
  "client_id" text not null references "oauth_clients"("client_id") on delete cascade,
  "user_id" text not null references "user_profiles"("user_id") on delete cascade,
  "redirect_uri" text not null,
  "scope" text not null,
  "resource" text not null,
  "code_challenge" text not null,
  "expires_at" timestamp with time zone not null,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);

create index if not exists "oauth_authorization_codes_expiry_idx"
  on "oauth_authorization_codes" ("expires_at");

create table if not exists "oauth_refresh_tokens" (
  "token_hash" text primary key not null,
  "client_id" text not null references "oauth_clients"("client_id") on delete cascade,
  "user_id" text not null references "user_profiles"("user_id") on delete cascade,
  "scope" text not null,
  "resource" text not null,
  "expires_at" timestamp with time zone not null,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);

create index if not exists "oauth_refresh_tokens_expiry_idx"
  on "oauth_refresh_tokens" ("expires_at");
