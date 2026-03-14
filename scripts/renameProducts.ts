import { getUncachableRevenueCatClient } from "../server/revenueCatClient";
import { listProducts, updatePackage, listOfferings, listPackages } from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;

async function run() {
  const client = await getUncachableRevenueCatClient();

  const { data: productsData, error } = await listProducts({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 100 },
  });
  if (error) throw new Error("Failed to list products: " + JSON.stringify(error));

  const renames: Array<{ id: string; current: string; newName: string }> = [];

  for (const p of productsData.items ?? []) {
    if (p.display_name === "Knitto Premium Monthly") {
      renames.push({ id: p.id, current: p.display_name, newName: "Knitto+ Monthly" });
    } else if (p.display_name === "Knitto Premium Yearly") {
      renames.push({ id: p.id, current: p.display_name, newName: "Knitto+ Yearly" });
    }
  }

  console.log(`Found ${renames.length} products to rename:`);
  renames.forEach(r => console.log(` - ${r.id}: "${r.current}" → "${r.newName}"`));

  for (const r of renames) {
    const { error: patchErr } = await client.patch({
      url: "/projects/{project_id}/products/{product_id}",
      path: { project_id: PROJECT_ID, product_id: r.id },
      body: { display_name: r.newName },
    });
    if (patchErr) {
      console.error(`Failed to rename ${r.id}:`, JSON.stringify(patchErr));
    } else {
      console.log(`✅ Renamed ${r.id} to "${r.newName}"`);
    }
  }

  // Also rename packages
  console.log("\nRenaming packages...");
  const { data: offerings } = await listOfferings({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 20 },
  });
  const offering = offerings?.items?.find(o => o.lookup_key === "default");
  if (offering) {
    const { data: packages } = await listPackages({
      client,
      path: { project_id: PROJECT_ID, offering_id: offering.id },
      query: { limit: 20 },
    });
    for (const pkg of packages?.items ?? []) {
      let newName = "";
      if (pkg.display_name === "Monthly Subscription") newName = "Knitto+ Monthly";
      if (pkg.display_name === "Annual Subscription") newName = "Knitto+ Yearly";
      if (newName) {
        const { error: pkgErr } = await updatePackage({
          client,
          path: { project_id: PROJECT_ID, package_id: pkg.id },
          body: { display_name: newName },
        });
        if (pkgErr) console.error(`Failed to rename package ${pkg.id}:`, JSON.stringify(pkgErr));
        else console.log(`✅ Package "${pkg.display_name}" → "${newName}"`);
      }
    }
  }

  console.log("\nDone!");
}

run().catch(console.error);
