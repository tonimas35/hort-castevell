import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jraxezlqdhwmxnzcrgcg.supabase.co'
const SUPABASE_KEY = 'sb_publishable_UQAT34PaUwL3cagFISGzUQ_u5ommm9l'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
