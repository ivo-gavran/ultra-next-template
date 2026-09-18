import { migrateDatabase, resetDatabase } from "./support/database";

export default async function globalSetup() {
  await migrateDatabase();
  await resetDatabase();
}
