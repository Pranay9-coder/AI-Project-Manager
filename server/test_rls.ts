import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

const adminClient = createClient(url, serviceRoleKey);

async function test() {
  // try inserting a dummy profile
  const id = '00000000-0000-0000-0000-000000000000'; // dummy uuid
  // Note: auth profile might fail if it violates foreign key to auth.users, so let's check the error
  const { data, error } = await adminClient.from('profiles').insert({
    id,
    name: 'Test',
    email: 'test@test.com',
    role_type: 'developer'
  });
  console.log('Result:', error);
}

test();
