interface SponsorItem {
  id: string;
  name: string;
  logoUrl: string | null;
  linkUrl: string | null;
  tier: "BASIC" | "FEATURED";
}

// El FEATURED se separa arriba, más grande — es literalmente lo que
// justifica que valga más que el BASIC. Si los mostráramos todos igual
// no habría diferencia real entre pagar uno u otro tier.
export function SponsorsSection({ sponsors }: { sponsors: SponsorItem[] }) {
  if (sponsors.length === 0) return null;

  const featured = sponsors.filter((s) => s.tier === "FEATURED");
  const basic = sponsors.filter((s) => s.tier === "BASIC");

  return (
    <div className="mt-8">
      <p className="mb-3 text-sm text-secondary">Con el apoyo de</p>

      {featured.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {featured.map((s) => (
            <a
              key={s.id}
              href={s.linkUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-surface-1 p-4"
            >
              {s.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logoUrl} alt={s.name} className="h-10 w-10 rounded object-contain" />
              )}
              <span className="font-medium">{s.name}</span>
            </a>
          ))}
        </div>
      )}

      {basic.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {basic.map((s) => (
            <a
              key={s.id}
              href={s.linkUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-surface-1 px-3 py-1.5 text-xs text-secondary"
            >
              {s.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
