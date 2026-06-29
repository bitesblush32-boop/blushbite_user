import postgres from 'postgres'

const sql = postgres(
  'postgresql://postgres:IEyufsebjCWfstCHSjJtpvuAXgInSxED@mainline.proxy.rlwy.net:55141/railway'
)

async function main() {
  console.log('Dropping old auth tables...')
  await sql`DROP TABLE IF EXISTS "account" CASCADE`
  await sql`DROP TABLE IF EXISTS "session" CASCADE`
  await sql`DROP TABLE IF EXISTS "verificationToken" CASCADE`
  console.log('Done. Now run: pnpm db:push')
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
