/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Kardeş projelerin çözüleceği portal origin'i. Boşsa https://lab.mhkapp.com. */
  readonly VITE_PORTAL_ORIGIN?: string
  /** Proje başına tam URL override'ı — local'de birden fazla projeyi gezmek için. */
  readonly VITE_ERP_URL?: string
  readonly VITE_INFLUENCER_URL?: string
  readonly VITE_TAHSILAT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
