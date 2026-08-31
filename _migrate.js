const { Pool } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_KjwrHQ4Nn6kL@ep-cold-darkness-a6c3btf6-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require';
const SUPABASE_URL = 'postgresql://postgres:thiqti2026@@@db.gbhinwovjmptjodbqkgt.supabase.co:5432/postgres';

async function main() {
  const neonPool = new Pool({ connectionString: NEON_URL });
  const supaPool = new Pool({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    // 1. Get all tables from Neon
    const neonClient = await neonPool.connect();
    const tables = await neonClient.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Neon tables:', tables.rows.map(r => r.table_name));

    for (const row of tables.rows) {
      const tbl = row.table_name;

      // Get schema
      const cols = await neonClient.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`, [tbl]
      );

      // Get count
      const countRes = await neonClient.query(`SELECT COUNT(*) FROM "${tbl}"`);
      const count = parseInt(countRes.rows[0].count);
      console.log(`  ${tbl}: ${count} rows, ${cols.rows.length} columns`);

      // Get data
      if (count > 0) {
        const data = await neonClient.query(`SELECT * FROM "${tbl}"`);
        console.log(`    Sample keys: ${Object.keys(data.rows[0]).join(', ')}`);
      }
    }

    neonClient.release();
    console.log('\nSchema inspection done. Now creating tables in Supabase...');

    // 2. Create tables in Supabase
    const supaClient = await supaPool.connect();

    for (const row of tables.rows) {
      const tbl = row.table_name;

      // Get full column info
      const cols = await neonClient.query(
        `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`, [tbl]
      ).catch(() => ({ rows: [] }));

      // Get CREATE TABLE from Neon using pg_dump-like approach
      const neonC = await neonPool.connect();
      const tableDef = await neonC.query(
        `SELECT pg_get_tabledef('public', '${tbl}')`
      ).catch(() => null);
      neonC.release();

      if (tableDef && tableDef.rows[0]) {
        console.log(`  Creating ${tbl}: ${tableDef.rows[0].pg_get_tabledef?.substring(0, 100)}...`);
      }
    }

    supaClient.release();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await neonPool.end();
    await supaPool.end();
  }
}

main();
