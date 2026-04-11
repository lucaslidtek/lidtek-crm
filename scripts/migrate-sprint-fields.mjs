// Run this script once to add priority and due_date columns to the sprints table
// Usage: node scripts/migrate-sprint-fields.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwtxotbpdqyjymfnpopw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dHhvdGJwZHF5anltZm5wb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjEzMTgsImV4cCI6MjA5MTI5NzMxOH0.7y0eZcymf1-v_hZk-afKt3IZM3QNGUDjO934t-NcdmE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Testing connection...');
  
  // Test by reading a sprint
  const { data: sprints, error } = await supabase.from('sprints').select('*').limit(1);
  if (error) {
    console.error('Error reading sprints:', error.message);
    return;
  }
  
  console.log('Existing sprint columns:', sprints.length > 0 ? Object.keys(sprints[0]) : 'no sprints found');
  
  // Check if priority column exists
  if (sprints.length > 0 && 'priority' in sprints[0]) {
    console.log('✅ priority column already exists');
  } else {
    console.log('⚠️  priority column does NOT exist — you need to add it via Supabase SQL Editor');
  }
  
  if (sprints.length > 0 && 'due_date' in sprints[0]) {
    console.log('✅ due_date column already exists');
  } else {
    console.log('⚠️  due_date column does NOT exist — you need to add it via Supabase SQL Editor');
  }
  
  console.log('\nTo add the columns, run this SQL in Supabase SQL Editor:');
  console.log(`
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE sprints ADD COLUMN IF NOT EXISTS due_date timestamptz;
  `);
}

migrate();
