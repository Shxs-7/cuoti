import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebnqkccdsngzdyzkpgyh.supabase.co';
const supabaseKey = 'sb_publishable_WhgtaL1SXsuzC5BDiYqH1A_TeTTLP80';

export const supabase = createClient(supabaseUrl, supabaseKey);
