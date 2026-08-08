import "dotenv/config";
import prisma from "../src/lib/prisma";
import { seedMarketing, seedUsers } from "../src/lib/db";

async function main() {
  const users = await Promise.all(
    [
      { email: "alice@example.com", name: "Alice Kamau" },
      { email: "brian@example.com", name: "Brian Otieno" },
      { email: "carol@example.com", name: "Carol Wanjiru" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name },
        create: u,
      })
    )
  );

  const existing = await prisma.post.count();
  if (existing === 0) {
    await prisma.post.createMany({
      data: [
        { title: "Welcome to Prisma Postgres", content: "Your starter data is live.", authorId: users[0].id },
        { title: "Safety first, always", content: "Drafted by Brian via the seed script.", authorId: users[1].id },
        { title: "Next steps", content: "Add your real models with prisma migrate dev.", authorId: users[0].id },
      ],
    });
  }

  await seedMarketing();
  try {
    await seedUsers();
  } catch (e) {
    console.warn("Admin seed skipped:", (e as Error).message);
  }

  console.log(`Seeded ${users.length} users and ${existing === 0 ? 3 : "existing"} posts into Prisma Postgres.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
