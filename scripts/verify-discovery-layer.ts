/**
 * Manual verification for SPR-005 WP-001.
 * Usage: cd webapp && npx --yes tsx scripts/verify-discovery-layer.ts
 */

import brands from "../src/data/brands.json";
import reports from "../src/data/reports.json";
import meta from "../src/data/meta.json";
import {
  browseAdvertisers,
  createDiscoveryDataset,
  getAdvertiserProfile,
  joinBrandReport,
  pickHighlightActivation,
} from "../src/lib/discovery";

const dataset = createDiscoveryDataset(brands, reports, meta);
const slug = "iol-inversiones";

const joined = joinBrandReport(slug, dataset);
const profile = getAdvertiserProfile(slug, dataset);
const browse = browseAdvertisers(dataset);

console.log("meta.highConfidenceAdvertisers:", dataset.meta.highConfidenceAdvertisers);
console.log("browse high_confidence count:", browse.length);
console.log("IOL join activations:", joined?.activations.length);
console.log("IOL profile activations:", profile?.activations.length);
console.log("IOL highlight quote length:", profile?.highlight?.quote.length ?? 0);
console.log("IOL highlight conc_at:", profile?.highlight?.concurrentViewers);
console.log(
  "pickHighlight matches profile:",
  pickHighlightActivation(joined!.activations)?.videoId === profile?.highlight?.videoId
);

const ok =
  joined?.activations.length === 8 &&
  profile?.activations.length === 8 &&
  (profile?.highlight?.quote.length ?? 0) > 0 &&
  browse.length === dataset.meta.highConfidenceAdvertisers;

if (!ok) {
  console.error("Verification FAILED");
  process.exit(1);
}
console.log("Verification OK");
