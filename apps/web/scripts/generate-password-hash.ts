import { hashPassword } from "../src/lib/auth";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: npx tsx scripts/generate-password-hash.ts <password>");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  console.log("ADMIN_PASSWORD_HASH=" + hash);
}

main();
