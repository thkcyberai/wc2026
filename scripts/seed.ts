import 'dotenv/config';
import { getDb } from '../src/lib/db';
import { seedDatabase } from '../src/lib/seed';

try {
  const db = getDb();
  const { teams, matches } = seedDatabase(db);
  console.log('✅ WC2026 database seeded');
  console.log(`   Teams:   ${teams}`);
  console.log(`   Matches: ${matches} (72 group + 32 knockout)`);
  console.log('   Groups A–L created, knockout bracket mapping installed.');
  console.log('\nNext: npm run dev  →  http://localhost:3000');
} catch (err) {
  console.error('❌ Seed failed:', err);
  process.exit(1);
}
