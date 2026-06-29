export type Partner = {
  name: string;
  logo: string;
  href?: string;
};

/** Add partner logos to public/images/partners/ */
export const PARTNERS: Partner[] = [
  {
    name: "Traviona Consulting",
    logo: "/images/partners/tratra.png",
  },
];
