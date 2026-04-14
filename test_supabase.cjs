const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Fetching tasks...');
  const { data, error } = await supabase.from('tasks').select('*').limit(1);
  if (error) {
    console.error('Fetch error:', error);
    return;
  }
  const task = data[0];
  if (!task) {
    console.log('No tasks found');
    return;
  }
  
  console.log('Updating task:', task.id);
  // Pass an undefined field just like TaskEditDialog does!
  // In `TaskEditDialog`, we do:
  const updates = {
    title: task.title,
    // simulation:
    owner_ids: []
  };
  
  console.log('payload is', updates);
  
  const { data: updated, error: updateErr } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', task.id)
    .select()
    .single();
    
  if (updateErr) {
    console.error('UPDATE ERROR:', updateErr);
  } else {
    console.log('UPDATE SUCCESS:', updated.id);
  }
}

test();
