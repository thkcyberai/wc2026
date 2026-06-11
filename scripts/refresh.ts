import 'dotenv/config';
import { getDb, isSeeded } from '../src/lib/db';
import { runRefresh } from '../src/lib/refresh';

async function main() {
  const db = getDb();
  if (!isSeeded()) {
    console.error('❌ Database not seeded yet. Run: npm run seed');
    process.exit(1);
  }
  console.log('⏳ Refreshing World Cup data…');
  const result = await runRefresh(db);
  console.log(result.ok ? '✅ Refresh complete' : '⚠️  Refresh finished with problems');
  console.log(`   Source:           ${result.source}`);
  console.log(`   Matches updated:  ${result.matchesUpdated}`);
  console.log(`   Knockout slots:   ${result.knockoutSlotsResolved} resolved`);
  console.log(`   ${result.message}`);
  if (result.friendlyError) console.log(`   💡 ${result.friendlyError}`);
}

main().catch((err) => {
  console.error('❌ Refresh failed:', err);
  process.exit(1);
});
