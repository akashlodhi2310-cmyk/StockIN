import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhfqunatfespyushkjjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnF1bmF0ZmVzcHl1c2hramptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTkyMjI3MiwiZXhwIjoyMTA1NDk4MjcyfQ.CvwQT6cMObrmc78OB_odzdj70AarXR5tI7mFOCp3WxE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error:', error);
    return;
  }
  const users = data.users.filter(u => u.email === 'lodhi@gmail.com');
  console.log(JSON.stringify(users, null, 2));
}
main();
