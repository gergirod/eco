import AdvertiserBrowseCard from "@/components/discovery/AdvertiserBrowseCard";
import type { DiscoveryBrowseItem } from "@/lib/discovery";

type DiscoveryHeroPreviewProps = {
  items: DiscoveryBrowseItem[];
};

export default function DiscoveryHeroPreview({ items }: DiscoveryHeroPreviewProps) {
  if (!items.length) return null;

  return (
    <section className="mb-10 -mx-1" aria-label="Anunciantes destacados">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <AdvertiserBrowseCard key={item.slug} item={item} variant="featured" />
        ))}
      </div>
    </section>
  );
}
