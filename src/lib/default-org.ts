import { db, organizations, projects, itemCategories, catalogItems } from "@/lib/db";
import { asc, inArray } from "drizzle-orm";

export async function getDefaultOrg() {
  // Return the oldest org in the DB — covers existing Clerk orgs that already
  // have real project data. Only create a fresh "__default__" org when the DB
  // has no org at all (new install).
  const [existing] = await db
    .select()
    .from(organizations)
    .orderBy(asc(organizations.createdAt))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(organizations)
    .values({ clerkOrgId: "__default__", name: "GP Interior AI" })
    .returning();
  return created;
}

// Merge all duplicate orgs into the oldest one so going forward only one org exists.
// Safe to call multiple times. Use from a one-time admin/init endpoint if needed.
export async function consolidateOrgs() {
  const orgs = await db
    .select()
    .from(organizations)
    .orderBy(asc(organizations.createdAt));
  if (orgs.length <= 1) return;

  const keeper = orgs[0];
  const dupeIds = orgs.slice(1).map(o => o.id);

  await Promise.all([
    db.update(projects).set({ orgId: keeper.id }).where(inArray(projects.orgId, dupeIds)),
    db.update(itemCategories).set({ orgId: keeper.id }).where(inArray(itemCategories.orgId, dupeIds)),
    db.update(catalogItems).set({ orgId: keeper.id }).where(inArray(catalogItems.orgId, dupeIds)),
  ]);

  await db.delete(organizations).where(inArray(organizations.id, dupeIds));
}
