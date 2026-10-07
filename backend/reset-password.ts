import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhfqunatfespyushkjjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnF1bmF0ZmVzcHl1c2hramptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTkyMjI3MiwiZXhwIjoyMTA1NDk4MjcyfQ.CvwQT6cMObrmc78OB_odzdj70AarXR5tI7mFOCp3WxE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);
  
  const user = users.users.find(u => u.email === 'lodhi@gmail.com');
  if (!user) return console.log('User not found');

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: 'Akash@1122' }
  );
  console.log(error ? error.message : "Password reset to Akash@1122 successfully");
}
main();
