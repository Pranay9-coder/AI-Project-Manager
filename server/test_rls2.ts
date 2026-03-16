import { AuthService } from './src/services/authService';
import { supabaseAdmin } from './src/config/supabase';

async function test() {
  const id = '00000000-0000-0000-0000-000000000001';
  try {
    const p = await AuthService.createProfile(id, {
      name: 'Test2',
      email: 'test2@test.com',
      role_type: 'developer',
      specialization: 'Frontend',
      skills: ['react']
    });
    console.log('Success:', p);
  } catch(e) {
    console.log('Error:', e);
  }
}
test();
