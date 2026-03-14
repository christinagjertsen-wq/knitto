import { getUncachableRevenueCatClient } from "../server/revenueCatClient";
import {
  listProducts,
  createProduct,
  listEntitlements,
  attachProductsToEntitlement,
  listOfferings,
  listPackages,
  createPackages,
  attachProductsToPackage,
  deleteProduct,
  type App,
  type Product,
} from "replit-revenuecat-v2";

const PROJECT_ID = process.env.REVENUECAT_PROJECT_ID!;
const TEST_APP_ID = process.env.REVENUECAT_TEST_STORE_APP_ID!;
const APPLE_APP_ID = process.env.REVENUECAT_APPLE_APP_STORE_APP_ID!;
const ANDROID_APP_ID = process.env.REVENUECAT_GOOGLE_PLAY_STORE_APP_ID!;

const YEARLY_IDENTIFIER = "knitto_premium_yearly";
const YEARLY_PLAY_IDENTIFIER = "knitto_premium_yearly:yearly";
const YEARLY_DURATION = "P1Y";
const YEARLY_DISPLAY_NAME = "Knitto Premium Yearly";
const YEARLY_TITLE = "Knitto Premium";

const YEARLY_PRICES = [
  { amount_micros: 59990000, currency: "USD" },
  { amount_micros: 55990000, currency: "EUR" },
  { amount_micros: 708000000, currency: "NOK" },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function run() {
  const client = await getUncachableRevenueCatClient();

  console.log("Fetching current products...");
  const { data: productsData, error: productsErr } = await listProducts({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 100 },
  });
  if (productsErr) throw new Error("Failed to list products: " + JSON.stringify(productsErr));

  console.log("Existing products:");
  productsData.items?.forEach(p => console.log(" -", p.store_identifier, `(${p.app_id})`, p.id));

  const appIds: Record<string, string> = {
    test: TEST_APP_ID,
    apple: APPLE_APP_ID,
    android: ANDROID_APP_ID,
  };

  const getOrCreateYearly = async (
    label: string,
    appId: string,
    storeIdentifier: string,
    isTestStore: boolean
  ): Promise<Product> => {
    const existing = productsData.items?.find(
      p => p.store_identifier === storeIdentifier && p.app_id === appId
    );
    if (existing) {
      console.log(`[${label}] Yearly product already exists:`, existing.id);
      return existing;
    }

    const body: any = {
      store_identifier: storeIdentifier,
      app_id: appId,
      type: "subscription",
      display_name: YEARLY_DISPLAY_NAME,
    };
    if (isTestStore) {
      body.subscription = { duration: YEARLY_DURATION };
      body.title = YEARLY_TITLE;
    }

    const { data: created, error } = await createProduct({
      client,
      path: { project_id: PROJECT_ID },
      body,
    });
    if (error) throw new Error(`Failed to create [${label}] yearly product: ` + JSON.stringify(error));
    console.log(`[${label}] Created yearly product:`, created.id);
    return created;
  };

  const testYearly = await getOrCreateYearly("Test", TEST_APP_ID, YEARLY_IDENTIFIER, true);
  const appleYearly = await getOrCreateYearly("AppStore", APPLE_APP_ID, YEARLY_IDENTIFIER, false);
  const androidYearly = await getOrCreateYearly("PlayStore", ANDROID_APP_ID, YEARLY_PLAY_IDENTIFIER, false);

  console.log("\nAdding test store prices for yearly...");
  const { error: priceErr } = await client.post<TestStorePricesResponse>({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: PROJECT_ID, product_id: testYearly.id },
    body: { prices: YEARLY_PRICES },
  });
  if (priceErr) {
    const e = priceErr as any;
    if (e?.type === "resource_already_exists") {
      console.log("Yearly test store prices already set");
    } else {
      console.warn("Price warning:", JSON.stringify(priceErr));
    }
  } else {
    console.log("Yearly test store prices added");
  }

  console.log("\nAttaching yearly products to entitlement...");
  const { data: entitlements, error: entErr } = await listEntitlements({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 20 },
  });
  if (entErr) throw new Error("Failed to list entitlements");
  const ent = entitlements.items?.find(e => e.lookup_key === "premium");
  if (!ent) throw new Error("No 'premium' entitlement found");

  const { error: attachEntErr } = await attachProductsToEntitlement({
    client,
    path: { project_id: PROJECT_ID, entitlement_id: ent.id },
    body: { product_ids: [testYearly.id, appleYearly.id, androidYearly.id] },
  });
  if (attachEntErr && (attachEntErr as any).type !== "unprocessable_entity_error") {
    throw new Error("Failed to attach yearly to entitlement: " + JSON.stringify(attachEntErr));
  }
  console.log("Yearly products attached to entitlement (or already were)");

  console.log("\nFinding default offering...");
  const { data: offerings, error: offErr } = await listOfferings({
    client,
    path: { project_id: PROJECT_ID },
    query: { limit: 20 },
  });
  if (offErr) throw new Error("Failed to list offerings");
  const offering = offerings.items?.find(o => o.lookup_key === "default");
  if (!offering) throw new Error("No 'default' offering found");

  console.log("\nChecking for existing yearly package...");
  const { data: packages, error: pkgErr } = await listPackages({
    client,
    path: { project_id: PROJECT_ID, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (pkgErr) throw new Error("Failed to list packages");

  console.log("Existing packages:", packages.items?.map(p => p.lookup_key).join(", "));

  let yearlyPkg = packages.items?.find(p => p.lookup_key === "$rc_annual");
  if (!yearlyPkg) {
    const { data: newPkg, error } = await createPackages({
      client,
      path: { project_id: PROJECT_ID, offering_id: offering.id },
      body: { lookup_key: "$rc_annual", display_name: "Annual Subscription" },
    });
    if (error) throw new Error("Failed to create yearly package: " + JSON.stringify(error));
    yearlyPkg = newPkg;
    console.log("Created yearly package:", yearlyPkg.id);
  } else {
    console.log("Yearly package already exists:", yearlyPkg.id);
  }

  const { error: attachPkgErr } = await attachProductsToPackage({
    client,
    path: { project_id: PROJECT_ID, package_id: yearlyPkg.id },
    body: {
      products: [
        { product_id: testYearly.id, eligibility_criteria: "all" },
        { product_id: appleYearly.id, eligibility_criteria: "all" },
        { product_id: androidYearly.id, eligibility_criteria: "all" },
      ],
    },
  });
  if (attachPkgErr) {
    const e = attachPkgErr as any;
    if (e?.type === "unprocessable_entity_error" && e?.message?.includes("Cannot attach product")) {
      console.log("Yearly products already attached to package");
    } else {
      throw new Error("Failed to attach yearly to package: " + JSON.stringify(attachPkgErr));
    }
  } else {
    console.log("Yearly products attached to package");
  }

  console.log("\n✅ RevenueCat updated successfully!");
  console.log("Monthly: 69 kr/mnd (knitto_premium_monthly)");
  console.log("Yearly:  708 kr/år (knitto_premium_yearly)");
}

run().catch(console.error);
