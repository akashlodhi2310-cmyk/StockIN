import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhfqunatfespyushkjjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnF1bmF0ZmVzcHl1c2hramptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjIyNzIsImV4cCI6MjEwNTQ5ODI3Mn0.wehJgYI09uF3pne-24gwKAPq8Z4Zz8V_qQzt8ADwYoA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'lodhi@gmail.com',
    password: 'Akash@1122'
  });
  console.log(error ? error.message : "Success");
}
main();
