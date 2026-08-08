import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  const count = await prisma.user.count();
  const latest = await prisma.user.findFirst({ orderBy: { id: "desc" } });
  console.log(`✅ Connected. users: ${count} (latest: ${latest?.name ?? "n/a"} <${latest?.email ?? "n/a"}>)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
