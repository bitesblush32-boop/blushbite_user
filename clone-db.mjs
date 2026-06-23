/**
 * clone-db.mjs — Full PostgreSQL database clone (schema + data)
 * Clones production → staging without requiring pg_dump
 */

import pg from 'pg'

const { Client } = pg

const PROD_URL = 'postgresql://postgres:ROARvRZMHpcrpFYNrAVkHuBSmujjUCms@thomas.proxy.rlwy.net:28649/railway'
const STAGING_URL = 'postgresql://postgres:EmEiEvPBFFtGkPhTTbvqcIQPsbxVpxiL@reseau.proxy.rlwy.net:31087/railway'

const prod    = new Client({ connectionString: PROD_URL,    ssl: { rejectUnauthorized: false } })
const staging = new Client({ connectionString: STAGING_URL, ssl: { rejectUnauthorized: false } })

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`) }

async function run() {
  log('Connecting to prod...')
  await prod.connect()
  log('Connecting to staging...')
  await staging.connect()

  // ── 1. ENUMS ──────────────────────────────────────────────────────────────
  log('\n── Exporting enums ──')
  const { rows: enums } = await prod.query(`
    SELECT t.typname AS name,
           array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM   pg_type t
    JOIN   pg_enum e ON e.enumtypid = t.oid
    JOIN   pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE  n.nspname = 'public'
    GROUP  BY t.typname
  `)
  log(`Found ${enums.length} enum type(s)`)

  for (const e of enums) {
    await staging.query(`DROP TYPE IF EXISTS "${e.name}" CASCADE`)
    const labels = e.labels.map(l => `'${l}'`).join(', ')
    await staging.query(`CREATE TYPE "${e.name}" AS ENUM (${labels})`)
    log(`  enum: ${e.name} (${e.labels.join(', ')})`)
  }

  // ── 2. SEQUENCES (create stubs early so tables can reference them) ─────────
  log('\n── Exporting sequences ──')
  const { rows: seqs } = await prod.query(`
    SELECT sequence_name, data_type, start_value, increment, minimum_value, maximum_value, cycle_option
    FROM   information_schema.sequences
    WHERE  sequence_schema = 'public'
  `)
  log(`Found ${seqs.length} sequence(s)`)

  for (const s of seqs) {
    await staging.query(`DROP SEQUENCE IF EXISTS "${s.sequence_name}" CASCADE`)
    await staging.query(`
      CREATE SEQUENCE "${s.sequence_name}"
        AS ${s.data_type}
        START ${s.start_value}
        INCREMENT ${s.increment}
        MINVALUE ${s.minimum_value}
        MAXVALUE ${s.maximum_value}
        ${s.cycle_option === 'YES' ? 'CYCLE' : 'NO CYCLE'}
    `)
    log(`  seq: ${s.sequence_name}`)
  }

  // ── 3. TABLES ─────────────────────────────────────────────────────────────
  log('\n── Exporting table schemas ──')
  // Get ordered list (no FK deps first)
  const { rows: tables } = await prod.query(`
    SELECT tablename
    FROM   pg_tables
    WHERE  schemaname = 'public'
    ORDER  BY tablename
  `)
  log(`Found ${tables.length} table(s)`)

  // Drop all tables on staging first (reverse dep order via CASCADE)
  for (const t of [...tables].reverse()) {
    await staging.query(`DROP TABLE IF EXISTS "${t.tablename}" CASCADE`)
  }

  // Recreate each table
  for (const { tablename } of tables) {
    const { rows: cols } = await prod.query(`
      SELECT
        c.column_name,
        c.data_type,
        c.udt_name,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default,
        c.is_identity,
        c.identity_generation,
        c.identity_start,
        c.identity_increment,
        c.identity_minimum,
        c.identity_maximum,
        c.identity_cycle
      FROM   information_schema.columns c
      WHERE  c.table_schema = 'public'
        AND  c.table_name   = $1
      ORDER  BY c.ordinal_position
    `, [tablename])

    const colDefs = cols.map(c => {
      let type
      if (c.data_type === 'USER-DEFINED')        type = `"${c.udt_name}"`
      else if (c.data_type === 'ARRAY')           type = `"${c.udt_name.replace(/^_/, '')}"[]`
      else if (c.data_type === 'character varying')
        type = c.character_maximum_length ? `varchar(${c.character_maximum_length})` : 'text'
      else if (c.data_type === 'character')       type = `char(${c.character_maximum_length || 1})`
      else if (c.data_type === 'numeric')
        type = (c.numeric_precision && c.numeric_scale != null)
          ? `numeric(${c.numeric_precision},${c.numeric_scale})` : 'numeric'
      else                                        type = c.data_type

      let def = `"${c.column_name}" ${type}`

      if (c.is_identity === 'YES') {
        const cycle = c.identity_cycle === 'YES' ? 'CYCLE' : 'NO CYCLE'
        def += ` GENERATED ${c.identity_generation} AS IDENTITY`
          + ` (START ${c.identity_start} INCREMENT ${c.identity_increment}`
          + ` MINVALUE ${c.identity_minimum} MAXVALUE ${c.identity_maximum} ${cycle})`
      } else if (c.column_default) {
        def += ` DEFAULT ${c.column_default}`
      }

      if (c.is_nullable === 'NO' && c.is_identity !== 'YES') def += ' NOT NULL'

      return def
    })

    await staging.query(`CREATE TABLE "${tablename}" (${colDefs.join(', ')})`)
    log(`  table: ${tablename} (${cols.length} columns)`)
  }

  // ── 4. DATA ────────────────────────────────────────────────────────────────
  log('\n── Copying data ──')
  let totalRows = 0

  for (const { tablename } of tables) {
    const { rows: data } = await prod.query(`SELECT * FROM "${tablename}"`)
    if (data.length === 0) {
      log(`  ${tablename}: 0 rows (skipped)`)
      continue
    }

    const cols = Object.keys(data[0])
    const quotedCols = cols.map(c => `"${c}"`).join(', ')

    // Batch insert in chunks of 500
    const BATCH = 500
    for (let i = 0; i < data.length; i += BATCH) {
      const chunk = data.slice(i, i + BATCH)
      const values = []
      const params = []
      let paramIdx = 1

      for (const row of chunk) {
        const rowParams = cols.map(c => {
          params.push(row[c])
          return `$${paramIdx++}`
        })
        values.push(`(${rowParams.join(', ')})`)
      }

      await staging.query(
        `INSERT INTO "${tablename}" (${quotedCols}) VALUES ${values.join(', ')}`,
        params
      )
    }

    log(`  ${tablename}: ${data.length} rows`)
    totalRows += data.length
  }

  // ── 5. PRIMARY KEYS ────────────────────────────────────────────────────────
  log('\n── Adding primary keys ──')
  const { rows: pks } = await prod.query(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS cols
    FROM   information_schema.table_constraints tc
    JOIN   information_schema.key_column_usage kcu
           ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    WHERE  tc.constraint_type = 'PRIMARY KEY'
      AND  tc.table_schema    = 'public'
    GROUP  BY tc.table_name, tc.constraint_name
  `)
  for (const pk of pks) {
    const cols = pk.cols.map(c => `"${c}"`).join(', ')
    try {
      await staging.query(`ALTER TABLE "${pk.table_name}" ADD CONSTRAINT "${pk.constraint_name}" PRIMARY KEY (${cols})`)
      log(`  pk: ${pk.table_name}(${pk.cols.join(', ')})`)
    } catch (e) {
      log(`  WARN pk ${pk.constraint_name}: ${e.message}`)
    }
  }

  // ── 6. UNIQUE CONSTRAINTS ──────────────────────────────────────────────────
  log('\n── Adding unique constraints ──')
  const { rows: uqs } = await prod.query(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS cols
    FROM   information_schema.table_constraints tc
    JOIN   information_schema.key_column_usage kcu
           ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    WHERE  tc.constraint_type = 'UNIQUE'
      AND  tc.table_schema    = 'public'
    GROUP  BY tc.table_name, tc.constraint_name
  `)
  for (const uq of uqs) {
    const cols = uq.cols.map(c => `"${c}"`).join(', ')
    try {
      await staging.query(`ALTER TABLE "${uq.table_name}" ADD CONSTRAINT "${uq.constraint_name}" UNIQUE (${cols})`)
      log(`  uq: ${uq.table_name}(${uq.cols.join(', ')})`)
    } catch (e) {
      log(`  WARN uq ${uq.constraint_name}: ${e.message}`)
    }
  }

  // ── 7. FOREIGN KEYS ────────────────────────────────────────────────────────
  log('\n── Adding foreign keys ──')
  const { rows: fks } = await prod.query(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS cols,
      ccu.table_name  AS ref_table,
      array_agg(ccu.column_name ORDER BY kcu.ordinal_position) AS ref_cols,
      rc.delete_rule,
      rc.update_rule
    FROM   information_schema.table_constraints tc
    JOIN   information_schema.key_column_usage kcu
           ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    JOIN   information_schema.referential_constraints rc
           ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
    JOIN   information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = rc.unique_constraint_name AND ccu.table_schema = tc.table_schema
    WHERE  tc.constraint_type = 'FOREIGN KEY'
      AND  tc.table_schema    = 'public'
    GROUP  BY tc.constraint_name, tc.table_name, ccu.table_name, rc.delete_rule, rc.update_rule
  `)
  for (const fk of fks) {
    const cols    = fk.cols.map(c => `"${c}"`).join(', ')
    const refCols = fk.ref_cols.map(c => `"${c}"`).join(', ')
    const onDel   = fk.delete_rule !== 'NO ACTION' ? ` ON DELETE ${fk.delete_rule}` : ''
    const onUpd   = fk.update_rule !== 'NO ACTION' ? ` ON UPDATE ${fk.update_rule}` : ''
    try {
      await staging.query(
        `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}"` +
        ` FOREIGN KEY (${cols}) REFERENCES "${fk.ref_table}" (${refCols})${onDel}${onUpd}`
      )
      log(`  fk: ${fk.table_name}.${fk.cols} → ${fk.ref_table}.${fk.ref_cols}`)
    } catch (e) {
      log(`  WARN fk ${fk.constraint_name}: ${e.message}`)
    }
  }

  // ── 8. INDEXES (non-constraint) ────────────────────────────────────────────
  log('\n── Adding indexes ──')
  const { rows: idxs } = await prod.query(`
    SELECT indexname, indexdef
    FROM   pg_indexes
    WHERE  schemaname = 'public'
      AND  indexname NOT IN (
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      )
  `)
  for (const idx of idxs) {
    try {
      await staging.query(idx.indexdef)
      log(`  idx: ${idx.indexname}`)
    } catch (e) {
      log(`  WARN idx ${idx.indexname}: ${e.message}`)
    }
  }

  // ── 9. RESET SEQUENCES to match current max IDs ────────────────────────────
  log('\n── Resetting sequences ──')
  const { rows: seqDeps } = await staging.query(`
    SELECT
      seq.relname          AS seqname,
      tab.relname          AS tablename,
      attr.attname         AS colname
    FROM   pg_class seq
    JOIN   pg_depend d    ON d.objid = seq.oid AND d.deptype = 'a'
    JOIN   pg_attribute attr ON attr.attrelid = d.refobjid AND attr.attnum = d.refobjsubid
    JOIN   pg_class tab  ON tab.oid = d.refobjid
    WHERE  seq.relkind = 'S'
  `)
  for (const s of seqDeps) {
    try {
      await staging.query(`SELECT setval('"${s.seqname}"', COALESCE((SELECT MAX("${s.colname}") FROM "${s.tablename}"), 1))`)
      log(`  seq reset: ${s.seqname}`)
    } catch (e) {
      log(`  WARN seq ${s.seqname}: ${e.message}`)
    }
  }

  // ── 10. CHECK CONSTRAINTS ──────────────────────────────────────────────────
  log('\n── Adding check constraints ──')
  const { rows: checks } = await prod.query(`
    SELECT tc.constraint_name, tc.table_name, cc.check_clause
    FROM   information_schema.table_constraints tc
    JOIN   information_schema.check_constraints cc
           ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.table_schema
    WHERE  tc.constraint_type = 'CHECK'
      AND  tc.table_schema    = 'public'
      AND  tc.constraint_name NOT LIKE '%_not_null'
  `)
  for (const ck of checks) {
    try {
      await staging.query(`ALTER TABLE "${ck.table_name}" ADD CONSTRAINT "${ck.constraint_name}" CHECK (${ck.check_clause})`)
      log(`  check: ${ck.table_name} → ${ck.constraint_name}`)
    } catch (e) {
      log(`  WARN check ${ck.constraint_name}: ${e.message}`)
    }
  }

  log('\n── Done ──')
  log(`Total rows copied: ${totalRows}`)

  // ── VERIFY ─────────────────────────────────────────────────────────────────
  log('\n── Verification (staging row counts) ──')
  for (const { tablename } of tables) {
    const { rows } = await staging.query(`SELECT COUNT(*) AS n FROM "${tablename}"`)
    if (parseInt(rows[0].n) > 0) log(`  ${tablename}: ${rows[0].n} rows`)
  }

  await prod.end()
  await staging.end()
  log('\nAll done. Staging is an exact replica of production.')
}

run().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
