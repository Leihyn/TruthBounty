import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkDatabase() {
  console.log('Checking database connection...\n');

  // Check platforms table
  const { data: platforms, error: platformError } = await supabase
    .from('platforms')
    .select('*');

  if (platformError) {
    console.log('❌ Platforms table error:', platformError.message);
    console.log('\n🔧 You need to run the database schema!');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents from supabase/schema.sql');
    console.log('3. Run the script\n');
    process.exit(1);
  }

  console.log('✅ Database connected successfully!');
  console.log(`\n📋 Platforms in database: ${platforms?.length || 0}`);
  if (platforms && platforms.length > 0) {
    platforms.forEach(p => {
      console.log(`   - ${p.name} (${p.chain})`);
    });
  }

  // Check if there's any data
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('id')
    .limit(1);

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  console.log(`\n📊 Data status:`);
  console.log(`   Users: ${users?.length || 0}`);
  console.log(`   Bets: ${bets?.length || 0}`);

  if (!bets || bets.length === 0) {
    console.log('\n💡 Database is ready but has no data yet.');
    console.log('   Run the indexer to populate it: npm run index:pancakeswap:mainnet\n');
  } else {
    console.log('\n✅ Database has data! Ready to use.\n');
  }
}

checkDatabase();
