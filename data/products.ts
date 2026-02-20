export interface Product {
  id: string;
  name: string;
  price: number;
  color: string;
  sizes: string[];
  stock: number;
  image: string;
  images: string[];
  description: string;
  isLimited?: boolean;
  releaseDate?: string;
  totalMade?: number;
  soldInMinutes?: number;
  waitlistCount?: number;
  exclusiveAccess?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Essential Black Tee - 100% Supima Cotton",
    price: 189,
    color: "Black",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 2,
    image: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3lj5t3hjjp7i1wmfh27l4",
    images: [
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3lj5t3hjjp7i1wmfh27l4",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/daoxq1mb9u1cwd4bj66va",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0hvce9738hjhzokbvie5l",
    ],
    description: "Premium round neck tee crafted from 100% Supima Cotton - the finest cotton in the world. Supima's extra-long staple fibers create an incredibly soft, durable fabric that resists pilling and maintains its luxurious feel wash after wash. Each piece is individually numbered and comes with a certificate of authenticity. Only 50 pieces ever made.",
    isLimited: true,
    totalMade: 50,
    soldInMinutes: 4,
    waitlistCount: 1847,
  },
  {
    id: "2",
    name: "Essential White Tee - 100% Supima Cotton",
    price: 189,
    color: "White",
    sizes: ["XS", "S", "M", "L"],
    stock: 1,
    image: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dlgffhkgm6s1zmrqb0hzl",
    images: [
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dlgffhkgm6s1zmrqb0hzl",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vo6vrkopn98ae32fhvxnq",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/duzd7zffx5dtrkk5g9xkr",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/9xo0z2b8pqavf80k0q4nz",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/icjwz7uqu0fcngcafnxh9",
    ],
    description: "The companion to our Essential Black. Pristine white perfection crafted from 100% Supima Cotton - the finest cotton in the world. Supima's extra-long staple fibers create an incredibly soft, durable fabric that resists pilling and maintains its luxurious feel wash after wash. Each piece individually crafted and numbered. Final piece available.",
    isLimited: true,
    totalMade: 50,
    soldInMinutes: 6,
    waitlistCount: 2134,

  },
  {
    id: "3",
    name: "Essential V-Neck Tee - 100% Supima Cotton",
    price: 189,
    color: "Black/White",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 3,
    image: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6272n8yf01pi11lp1rjvk",
    images: [
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/6272n8yf01pi11lp1rjvk",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pi5nydfeok07wru70xigr",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xkmwhsa9ls4seds1u2nm2",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ug3xn8a55t7oxtpve9zlt",
      "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/yi5lmgpdoh4dqhhjhu72u",
    ],
    description: "Premium V-neck silhouette crafted from 100% Supima Cotton - the finest cotton in the world. Supima's extra-long staple fibers create an incredibly soft, durable fabric that resists pilling and maintains its luxurious feel wash after wash. Available in classic black and pristine white, each piece features our signature YÈMALÍN branding.",
    isLimited: false,
  },

];

export const comingSoonProducts = [
  {
    id: "cs1",
    name: "YÈMALÍN Luxury Bag",
    price: 2890,
    color: "Signature",
    releaseDate: "2026-04-01",
    image: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/y1x4ydfige0fmav4okany",
    description: "The ultimate expression of luxury. Handcrafted Italian leather with signature Y hardware in 18k gold plating. Each bag takes 72 hours to create by our master artisans. Limited to 100 pieces worldwide with individual serial numbers.",
    totalMade: 100,
    exclusiveAccess: true,
    waitlistCount: 3847,
  },
  {
    id: "cs2",
    name: "YÈMALÍN Luxury Denim - Women's",
    price: 489,
    color: "Light Wash / Dark Wash",
    releaseDate: "2026-04-15",
    image: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ry9j00txg3l7n5pkmdytb",
    description: "Premium Japanese selvedge denim with signature YÈMALÍN detailing. Hand-finished with gold hardware and leather patch. Perfect fit engineered through 3D body scanning technology. Limited first release of 200 pieces.",
    totalMade: 200,
    exclusiveAccess: false,
    waitlistCount: 2156,
  },
  {
    id: "cs3",
    name: "YÈMALÍN Luxury Denim - Men's",
    price: 489,
    color: "Dark Indigo",
    releaseDate: "2026-04-15",
    image: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cupof2g8wolsfylk9g4vy",
    description: "YÈMALÍN HOMME collection. Premium Japanese selvedge denim with signature detailing. Crafted for the modern gentleman with gold hardware accents and embossed leather patch. Limited first release of 200 pieces.",
    totalMade: 200,
    exclusiveAccess: false,
    waitlistCount: 1987,
  },
];