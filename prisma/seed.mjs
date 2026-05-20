import { disconnectDatabase, seedDatabase } from "../src/lib/db.mjs";

try {
  const result = await seedDatabase();
  console.log(
    `Seeded TECHNOseller database: ${result.vendorCount} vendors, ${result.leadCount} leads`
  );
} finally {
  await disconnectDatabase();
}
