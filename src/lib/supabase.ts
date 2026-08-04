import { createClient } from '@supabase/supabase-js'

// muhiku-portal ile AYNI Supabase projesi. Oturum, aynı origin altında (portal → /erp
// rewrite) localStorage üzerinden paylaşılır; bağımsız açıldığında kullanıcı anonimdir
// → rol katmanı FAIL CLOSED davranır (bkz. src/auth/RoleContext.tsx).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase ortam değişkenleri eksik. Lütfen .env dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
