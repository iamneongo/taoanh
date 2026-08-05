import { db, itemCategories, catalogItems } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { getDefaultOrg } from "@/lib/default-org";
import { CatalogClient } from "./catalog-client";

export default async function CatalogPage() {
  const org = await getDefaultOrg();

  const [categories, items] = await Promise.all([
    db.select().from(itemCategories).where(eq(itemCategories.orgId, org.id)).orderBy(asc(itemCategories.sortOrder), asc(itemCategories.createdAt)),
    db.select().from(catalogItems).where(eq(catalogItems.orgId, org.id)).orderBy(asc(catalogItems.createdAt)),
  ]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <CatalogClient initialCategories={categories} initialItems={items} />
    </div>
  );
}
