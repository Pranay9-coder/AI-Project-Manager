import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

const anonClientAsAdmin = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  const { data, error } = await anonClientAsAdmin.auth.admin.createUser({
    email: 'test_anon@test.com',
    password: 'password123',
    email_confirm: true
  });
  console.log('Result:', error ? error.message : 'SUCCESS');
}
test();
