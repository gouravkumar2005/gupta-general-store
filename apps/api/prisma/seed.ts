import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProductSeed = {
  sku: string;
  name: string;
  searchKeywords?: string;
  unit: string;
  packSize?: string;
  price: number; // rupees
  mrp?: number;
  imageUrl?: string;
  isLoose?: boolean; // sold loose by weight — price is per kg, quantity is kg
  minOrderQty?: number; // minimum/step quantity in kg, only for isLoose items
};

type CategorySeed = {
  name: string;
  slug: string;
  products: ProductSeed[];
};

// A small representative sample of a general/grocery store's catalog.
// The real store has 5000+ SKUs — this is deliberately just enough
// (~80 items across 7 categories) to demonstrate browsing, search, cart,
// and the WhatsApp <-> website order flow for the demo.
const CATALOG: CategorySeed[] = [
  {
    name: "Grocery & Staples",
    slug: "grocery-staples",
    products: [
      { sku: "GS-001", name: "Aata (Wheat Flour)", searchKeywords: "atta, gehu ka atta, wheat flour", unit: "kg", packSize: "5kg", price: 44, isLoose: true, minOrderQty: 1, imageUrl: "/products/GS-001.jpg" },
      { sku: "GS-002", name: "Basmati Chawal", searchKeywords: "chawal, rice, basmati rice", unit: "kg", packSize: "5kg", price: 90, mrp: 100, isLoose: true, minOrderQty: 1, imageUrl: "/products/GS-002.jpg" },
      { sku: "GS-003", name: "Toor Dal", searchKeywords: "arhar dal, toor dal, tur dal", unit: "kg", packSize: "1kg", price: 160, isLoose: true, minOrderQty: 0.5, imageUrl: "/products/GS-003.jpg" },
      { sku: "GS-004", name: "Chana Dal", searchKeywords: "chana dal, bengal gram", unit: "kg", packSize: "1kg", price: 110, isLoose: true, minOrderQty: 0.5, imageUrl: "/products/GS-004.jpg" },
      { sku: "GS-005", name: "Moong Dal", searchKeywords: "moong dal, green gram dal", unit: "kg", packSize: "1kg", price: 130, isLoose: true, minOrderQty: 0.5, imageUrl: "/products/GS-005.jpg" },
      { sku: "GS-006", name: "Chini (Sugar)", searchKeywords: "chini, cheeni, sugar", unit: "kg", packSize: "1kg", price: 45, isLoose: true, minOrderQty: 0.1, imageUrl: "/products/GS-006.jpg" },
      { sku: "GS-007", name: "Namak (Salt)", searchKeywords: "namak, salt", unit: "kg", packSize: "1kg", price: 22, isLoose: true, minOrderQty: 0.25, imageUrl: "/products/GS-007.jpg" },
      { sku: "GS-008", name: "Sarson Tel", searchKeywords: "tel, mustard oil, sarso tel", unit: "litre", packSize: "1L", price: 165, imageUrl: "/products/GS-008.jpg" },
      { sku: "GS-009", name: "Refined Sunflower Oil", searchKeywords: "refined tel, sunflower oil", unit: "litre", packSize: "1L", price: 150, imageUrl: "/products/GS-009.jpg" },
      { sku: "GS-010", name: "Besan", searchKeywords: "besan, gram flour", unit: "kg", packSize: "1kg", price: 95, isLoose: true, minOrderQty: 0.25, imageUrl: "/products/GS-010.jpg" },
      { sku: "GS-011", name: "Suji (Rava)", searchKeywords: "suji, rava, sooji", unit: "kg", packSize: "1kg", price: 55, isLoose: true, minOrderQty: 0.25, imageUrl: "/products/GS-011.jpg" },
      { sku: "GS-012", name: "Poha", searchKeywords: "poha, flattened rice", unit: "kg", packSize: "500g", price: 90, isLoose: true, minOrderQty: 0.25, imageUrl: "/products/GS-012.jpg" },
      { sku: "GS-013", name: "Sabudana", searchKeywords: "sabudana, sago", unit: "kg", packSize: "500g", price: 140, isLoose: true, minOrderQty: 0.25, imageUrl: "/products/GS-013.jpg" },
      { sku: "GS-014", name: "Moong Sabut", searchKeywords: "sabut moong, whole moong", unit: "kg", packSize: "1kg", price: 140, isLoose: true, minOrderQty: 0.5, imageUrl: "/products/GS-014.jpg" },
      { sku: "GS-015", name: "Rajma", searchKeywords: "rajma, kidney beans", unit: "kg", packSize: "1kg", price: 150, isLoose: true, minOrderQty: 0.5, imageUrl: "/products/GS-015.jpg" },
    ],
  },
  {
    name: "Masale (Spices)",
    slug: "spices",
    products: [
      { sku: "SP-001", name: "Haldi Powder", searchKeywords: "haldi, turmeric", unit: "kg", packSize: "200g", price: 225, isLoose: true, minOrderQty: 0.05, imageUrl: "/products/SP-001.jpg" },
      { sku: "SP-002", name: "Mirch Powder", searchKeywords: "lal mirch, chilli powder", unit: "kg", packSize: "200g", price: 275, isLoose: true, minOrderQty: 0.05, imageUrl: "/products/SP-002.jpg" },
      { sku: "SP-003", name: "Dhaniya Powder", searchKeywords: "dhaniya, coriander powder", unit: "kg", packSize: "200g", price: 200, isLoose: true, minOrderQty: 0.05, imageUrl: "/products/SP-003.jpg" },
      { sku: "SP-004", name: "Garam Masala", searchKeywords: "garam masala", unit: "kg", packSize: "100g", price: 600, isLoose: true, minOrderQty: 0.05 },
      { sku: "SP-005", name: "Jeera (Cumin Seeds)", searchKeywords: "jeera, cumin", unit: "kg", packSize: "200g", price: 325, isLoose: true, minOrderQty: 0.05 },
      { sku: "SP-006", name: "Sarson (Mustard Seeds)", searchKeywords: "sarso, mustard seeds", unit: "kg", packSize: "100g", price: 300, isLoose: true, minOrderQty: 0.05 },
      { sku: "SP-007", name: "Hing (Asafoetida)", searchKeywords: "hing, asafoetida", unit: "kg", packSize: "50g", price: 1800, isLoose: true, minOrderQty: 0.01, imageUrl: "/products/SP-007.jpg" },
      { sku: "SP-008", name: "Kali Mirch (Black Pepper)", searchKeywords: "kali mirch, black pepper", unit: "kg", packSize: "100g", price: 1100, isLoose: true, minOrderQty: 0.02, imageUrl: "/products/SP-008.jpg" },
      { sku: "SP-009", name: "Elaichi (Cardamom)", searchKeywords: "elaichi, cardamom", unit: "kg", packSize: "50g", price: 3600, isLoose: true, minOrderQty: 0.01, imageUrl: "/products/SP-009.jpg" },
      { sku: "SP-010", name: "Tej Patta (Bay Leaf)", searchKeywords: "tej patta, bay leaf", unit: "kg", packSize: "50g", price: 400, isLoose: true, minOrderQty: 0.01, imageUrl: "/products/SP-010.jpg" },
    ],
  },
  {
    name: "Snacks & Namkeen",
    slug: "snacks",
    products: [
      { sku: "SN-001", name: "Aloo Bhujia", searchKeywords: "bhujia, aloo bhujia, namkeen", unit: "packet", packSize: "200g", price: 40 },
      { sku: "SN-002", name: "Moong Dal Namkeen", searchKeywords: "moong dal namkeen", unit: "packet", packSize: "200g", price: 45, imageUrl: "/products/SN-002.jpg" },
      { sku: "SN-003", name: "Parle-G Biscuit", searchKeywords: "parle g, biscuit, parle-g", unit: "packet", packSize: "200g", price: 20 },
      { sku: "SN-004", name: "Marie Gold Biscuit", searchKeywords: "marie biscuit, marie gold", unit: "packet", packSize: "150g", price: 35, imageUrl: "/products/SN-004.jpg" },
      { sku: "SN-005", name: "Kurkure", searchKeywords: "kurkure, chips", unit: "packet", packSize: "90g", price: 20, imageUrl: "https://images.unsplash.com/photo-1776178393300-48bc87f3b65b?w=400" },
      { sku: "SN-006", name: "Lays Chips", searchKeywords: "lays, chips, aloo chips", unit: "packet", packSize: "52g", price: 20, imageUrl: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
      { sku: "SN-007", name: "Khatta Meetha Mixture", searchKeywords: "khatta meetha, mixture namkeen", unit: "packet", packSize: "200g", price: 40, imageUrl: "/products/SN-007.jpg" },
      { sku: "SN-008", name: "Papad", searchKeywords: "papad", unit: "packet", packSize: "200g", price: 45, imageUrl: "/products/SN-008.jpg" },
      { sku: "SN-009", name: "Rusk", searchKeywords: "toast, rusk", unit: "packet", packSize: "200g", price: 35, imageUrl: "/products/SN-009.jpg" },
      { sku: "SN-010", name: "Maggi Noodles", searchKeywords: "maggi, noodles", unit: "packet", packSize: "70g", price: 14, imageUrl: "https://images.unsplash.com/photo-1679279726940-be5ce80c632c?w=400" },
    ],
  },
  {
    name: "Dairy & Ghee",
    slug: "dairy",
    products: [
      { sku: "DA-001", name: "Full Cream Milk", searchKeywords: "doodh, milk, full cream milk", unit: "litre", packSize: "1L", price: 66 },
      { sku: "DA-002", name: "Paneer", searchKeywords: "paneer, cottage cheese", unit: "gram", packSize: "200g", price: 90 },
      { sku: "DA-003", name: "Desi Ghee", searchKeywords: "ghee, desi ghee", unit: "gram", packSize: "500g", price: 320, mrp: 350 },
      { sku: "DA-004", name: "Dahi (Curd)", searchKeywords: "dahi, curd, yogurt", unit: "gram", packSize: "400g", price: 35 },
      { sku: "DA-005", name: "Butter", searchKeywords: "makkhan, butter", unit: "gram", packSize: "100g", price: 55, imageUrl: "/products/DA-005.jpg" },
      { sku: "DA-006", name: "Amul Cheese Slices", searchKeywords: "cheese, amul cheese", unit: "packet", packSize: "200g", price: 120, imageUrl: "/products/DA-006.jpg" },
    ],
  },
  {
    name: "Beverages",
    slug: "beverages",
    products: [
      { sku: "BV-001", name: "Chai Patti (Tea)", searchKeywords: "chai patti, tea leaves, chai", unit: "gram", packSize: "250g", price: 130, imageUrl: "/products/BV-001.jpg" },
      { sku: "BV-002", name: "Nescafe Coffee", searchKeywords: "coffee, nescafe", unit: "gram", packSize: "50g", price: 150, imageUrl: "https://images.unsplash.com/photo-1745892477174-61d2145109ed?w=400" },
      { sku: "BV-003", name: "Coca Cola", searchKeywords: "cold drink, coca cola, thumbs up, pepsi", unit: "piece", packSize: "750ml", price: 40, imageUrl: "https://images.unsplash.com/photo-1562952546-12992a813a51?w=400" },
      { sku: "BV-004", name: "Frooti", searchKeywords: "frooti, mango drink", unit: "piece", packSize: "200ml", price: 20, imageUrl: "https://images.unsplash.com/photo-1640213505284-21352ee0d76b?w=400" },
      { sku: "BV-005", name: "Real Fruit Juice", searchKeywords: "juice, real juice", unit: "piece", packSize: "1L", price: 110, imageUrl: "https://images.unsplash.com/photo-1697642452436-9c40773cbcbb?w=400" },
      { sku: "BV-006", name: "Bisleri Water Bottle", searchKeywords: "pani, water bottle, bisleri", unit: "piece", packSize: "1L", price: 20, imageUrl: "https://images.unsplash.com/photo-1633285807341-1cf3400bc31c?w=400" },
    ],
  },
  {
    name: "Sweets & Confectionary",
    slug: "sweets",
    products: [
      { sku: "SW-001", name: "Kaju Katli", searchKeywords: "kaju katli, mithai, sweets", unit: "gram", packSize: "250g", price: 280, imageUrl: "/products/SW-001.jpg" },
      { sku: "SW-002", name: "Gulab Jamun (Box)", searchKeywords: "gulab jamun, mithai", unit: "packet", packSize: "1kg", price: 220, imageUrl: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400" },
      { sku: "SW-003", name: "Soan Papdi", searchKeywords: "soan papdi, mithai", unit: "packet", packSize: "500g", price: 120, imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { sku: "SW-004", name: "Dairy Milk Chocolate", searchKeywords: "chocolate, dairy milk, cadbury", unit: "piece", packSize: "55g", price: 50, imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400" },
      { sku: "SW-005", name: "Assorted Gift Box", searchKeywords: "gift box, mithai gift box, assorted sweets", unit: "packet", packSize: "1kg", price: 450, mrp: 500, imageUrl: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400" },
      { sku: "SW-006", name: "Rasgulla (Tin)", searchKeywords: "rasgulla, mithai", unit: "packet", packSize: "1kg", price: 180, imageUrl: "/products/SW-006.jpg" },
    ],
  },
  {
    name: "Household",
    slug: "household",
    products: [
      { sku: "HH-001", name: "Surf Excel Detergent", searchKeywords: "detergent, surf excel, washing powder", unit: "gram", packSize: "1kg", price: 130, imageUrl: "/products/HH-001.jpg" },
      { sku: "HH-002", name: "Lifebuoy Soap", searchKeywords: "sabun, soap, lifebuoy", unit: "piece", packSize: "100g", price: 30, imageUrl: "/products/HH-002.jpg" },
      { sku: "HH-003", name: "Colgate Toothpaste", searchKeywords: "toothpaste, colgate", unit: "gram", packSize: "150g", price: 90, imageUrl: "/products/HH-003.jpg" },
      { sku: "HH-004", name: "Vim Dishwash Bar", searchKeywords: "vim, dishwash bar, bartan saaf", unit: "piece", packSize: "130g", price: 20 },
      { sku: "HH-005", name: "Harpic Toilet Cleaner", searchKeywords: "harpic, toilet cleaner", unit: "ml", packSize: "500ml", price: 95, imageUrl: "https://images.unsplash.com/photo-1550963295-019d8a8a61c5?w=400" },
      { sku: "HH-006", name: "Agarbatti", searchKeywords: "agarbatti, incense sticks", unit: "packet", packSize: "1 pack", price: 30, imageUrl: "/products/HH-006.jpg" },
      { sku: "HH-007", name: "Matchbox", searchKeywords: "maachis, matchbox", unit: "piece", packSize: "1 box", price: 2 },
      { sku: "HH-008", name: "Candles", searchKeywords: "mombatti, candle", unit: "packet", packSize: "pack of 6", price: 40 },
    ],
  },
];

async function main() {
  console.log("Seeding demo catalog...");

  for (const [catIndex, cat] of CATALOG.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: catIndex },
      create: { name: cat.name, slug: cat.slug, sortOrder: catIndex },
    });

    for (const p of cat.products) {
      const data = {
        name: p.name,
        searchKeywords: p.searchKeywords,
        categoryId: category.id,
        unit: p.unit,
        packSize: p.packSize,
        priceInPaise: Math.round(p.price * 100),
        mrpInPaise: p.mrp ? Math.round(p.mrp * 100) : null,
        isLoose: p.isLoose ?? false,
        minOrderQty: p.minOrderQty ?? null,
        imageUrl: p.imageUrl,
      };
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: data,
        create: { sku: p.sku, ...data },
      });
    }
  }

  const total = await prisma.product.count();
  console.log(`Seed complete. ${total} products across ${CATALOG.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
