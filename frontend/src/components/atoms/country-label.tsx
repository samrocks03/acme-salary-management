interface CountryLabelProps {
  code: string;
  name?: string;
}

/** "India IN" — readable name with the ISO code as a quiet suffix. */
export function CountryLabel({ code, name }: CountryLabelProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span>{name ?? code}</span>
      {name ? <span className="font-mono text-xs text-muted-foreground">{code}</span> : null}
    </span>
  );
}
