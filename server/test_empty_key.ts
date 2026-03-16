import { createClient } from '@supabase/supabase-js';

// Try using an EMPTY KEY for service role
const url = 'https://zqgpmbemfecwlwnlpemy.supabase.co';
const serviceRoleKey = ''; // empty

const adminClient = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  try {
    const res = await adminClient.auth.admin.createUser({
      email: 'test_empty@test.com',
      password: 'password123',
      email_confirm: true
    });
    console.log('createUser Result:', res.error ? res.error.message : 'SUCCESS');
  } catch(e: any) {
    console.log('createUser Exception:', e.message);
  }
}
test();
