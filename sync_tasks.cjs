const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data } = await supabase.from('tasks').select('id, title, sprint_id').limit(10);
  console.log('Tasks excerpt:', data);
  
  const { data: s } = await supabase.from('sprints').select('id, name').limit(10);
  console.log('Sprints excerpt:', s);
}
test();
