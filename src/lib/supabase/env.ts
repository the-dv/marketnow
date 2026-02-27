const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

try {
  const parsedUrl = new URL(supabaseUrl);
  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    throw new Error("INVALID_SUPABASE_URL_PROTOCOL");
  }
} catch {
  throw new Error("Invalid env var: NEXT_PUBLIC_SUPABASE_URL");
}

if (supabaseAnonKey.trim().length < 20) {
  throw new Error("Invalid env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseEnv = {
  url: supabaseUrl.trim(),
  anonKey: supabaseAnonKey.trim(),
};
