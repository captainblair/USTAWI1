/** Local property imagery — synced from /images/houses in public */

const houses = "/images/houses";

export type SampleProperty = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  bedrooms: number;
  cover: string;
  detail: string;
  gallery: string[];
};

export const SAMPLE_PROPERTIES: SampleProperty[] = [
  {
    id: "westlands-penthouse",
    title: "Nairobi, Westlands",
    subtitle: "Penthouse · 3 bed · Westlands",
    price: 85000,
    bedrooms: 3,
    cover: `${houses}/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-35-1024x683.jpg`,
    detail: `${houses}/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-2-1024x682.jpg`,
    gallery: [
      `${houses}/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-35-1024x683.jpg`,
      `${houses}/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-10-1024x683.jpg`,
      `${houses}/penthouse/Penthouse-for-Sale-in-Westlands-Nairobi-11-1024x682.jpg`,
    ],
  },
  {
    id: "peponi-villa",
    title: "Nairobi, Peponi",
    subtitle: "6-bed villa · Peponi Road",
    price: 120000,
    bedrooms: 6,
    cover: `${houses}/6 bedroom/6-Bedroom-Villa-for-Sale-in-Peponi-Nairobi-38-1024x683.jpg`,
    detail: `${houses}/6 bedroom/6-Bedroom-Villa-for-Sale-in-Peponi-Nairobi-10-1024x683.jpg`,
    gallery: [
      `${houses}/6 bedroom/6-Bedroom-Villa-for-Sale-in-Peponi-Nairobi-38-1024x683.jpg`,
      `${houses}/6 bedroom/6-Bedroom-Villa-for-Sale-in-Peponi-Nairobi-10-1024x683.jpg`,
      `${houses}/6 bedroom/6-Bedroom-Villa-for-Sale-in-Peponi-Nairobi-3-1024x683.jpg`,
    ],
  },
  {
    id: "karen-villa",
    title: "Nairobi, Karen",
    subtitle: "5-bed villa · Karen",
    price: 180000,
    bedrooms: 5,
    cover: `${houses}/5 bedroom/5-Bedroom-Villa-for-Sale-in-Karen-34-1024x683.jpg`,
    detail: `${houses}/5 bedroom/5-Bedroom-Villa-for-Sale-in-Karen-10-1024x682.jpg`,
    gallery: [
      `${houses}/5 bedroom/5-Bedroom-Villa-for-Sale-in-Karen-34-1024x683.jpg`,
      `${houses}/5 bedroom/5-Bedroom-Villa-for-Sale-in-Karen-10-1024x682.jpg`,
      `${houses}/5 bedroom/5-Bedroom-Villa-for-Sale-in-Karen-2-1024x683.jpg`,
    ],
  },
];

export const LOGO_PATH = "/images/logo/best.png";

/** Full-bleed hero — Karen villa at dusk */
export const HERO_IMAGE =
  `${houses}/5 bedroom/5-Bedroom-Villa-for-Sale-in-Karen-34-1024x683.jpg`;
