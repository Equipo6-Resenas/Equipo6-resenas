import type { Metadata } from "next";
import { inter, poppins } from "../../features/reviews/fonts";
import { TemporaryCatalog } from "../../features/reviews/TemporaryCatalog";

export const metadata: Metadata = {
  title: "Catálogo de eventos (temporal)",
};

export default function CatalogoTemporalPage() {
  return (
    <div className={`${inter.variable} ${poppins.variable}`}>
      <TemporaryCatalog />
    </div>
  );
}
