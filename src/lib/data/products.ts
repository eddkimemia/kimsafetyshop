import type { Product } from "../types";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type Download = { name: string; type: string; file?: string };

export function normalizeDownloads(downloads: Download[] | undefined): Download[] {
  const clean = (downloads ?? []).filter(
    (d) => d && !/certification file|usage guide/i.test(d.name || "")
  );
  if (!clean.some((d) => /datasheet/i.test(d.name || ""))) {
    clean.unshift({ name: "Product Datasheet (PDF)", type: "PDF" });
  }
  return clean;
}

function p(input: Omit<Product, "slug" | "bulk" | "downloads" | "specs" | "features"> & { features?: string[] }): Product {
  const tiers = [
    { qty: "1 – 9", price: "KES 0", savings: "" },
    { qty: "10 – 49", price: "", savings: "" },
    { qty: "50 – 199", price: "", savings: "" },
    { qty: "200+", price: "", savings: "" },
  ];
  const bulk = tiers.map((t, i) => {
    if (i === 0) return { qty: t.qty, price: `${input.price.toLocaleString()}`, savings: "Standard" };
    const discount = 0.05 + i * 0.04;
    const price = Math.round(input.price * (1 - discount));
    return { qty: t.qty, price: `${price.toLocaleString()}`, savings: `${Math.round(discount * 100)}% off` };
  });
  const specs: Product["specs"] = [
    { label: "Brand", value: input.brand },
    { label: "Model", value: input.model ?? input.sku },
    { label: "SKU", value: input.sku },
    { label: "Material", value: input.material ?? "Premium-grade materials" },
    { label: "Color", value: input.color ?? "Varies by option" },
    { label: "Weight", value: input.weight ?? "Lightweight design" },
    { label: "Size", value: input.size ?? "One size (adjustable)" },
    { label: "Certification", value: input.certification ?? "CE · ISO 9001" },
    { label: "Safety Standard", value: input.standard ?? "EN ISO compliant" },
    { label: "Manufacturer", value: input.brand },
    { label: "Country of Origin", value: input.country ?? "Import, quality inspected in Kenya" },
    { label: "Shelf Life", value: input.shelfLife ?? "5 years from manufacture" },
    { label: "Warranty", value: input.warranty ?? "12-month KimSafety warranty" },
  ];
  const features = input.features ?? [
    "Certified to international safety standards",
    "Quality-inspected at KimSafety's Nairobi warehouse",
    "Available in bulk with tiered discount pricing",
    "Same-day dispatch within Nairobi on orders before 3 PM",
    "Suitable for professional and personal use",
  ];
  return { ...input, slug: slugify(input.name), bulk, specs, features, downloads: [{ name: "Product Datasheet (PDF)", type: "PDF" }] };
}

export const products: Product[] = [
  p({
    id: "p-001", sku: "KS-MED-1001", name: "Nitrilution Exam Gloves — Nitrile Powder-Free", brand: "Ansell", category: "medical-safety", categoryName: "Medical Safety",
    price: 1850, oldPrice: 2100, stock: 482, lowStockAt: 50, rating: 4.9, reviews: 214, sold: 4820, model: "Microflex 93-260", featured: true, bestSeller: true,
    tags: ["medical", "nitrile", "gloves", "hospital"], material: "Nitrile rubber", size: "S · M · L · XL", weight: "320 g / 100 pcs", color: "Blue",
    certification: "EN 455 · ASTM D6319", standard: "EN ISO 374-5", country: "Malaysia", shelfLife: "5 years",
    description: "Hospital-grade powder-free nitrile examination gloves with textured fingertips for reliable grip during wet and dry procedures. Latex-free and hypoallergenic, ideal for examination, handling and general clinical use.",
    features: ["Powder-free, latex-free — safe for sensitive skin", "Textured fingertips for superior grip", "3.5 ml ambidextrous, single-use", "EN 455 medical grade certification", "100 pieces per dispenser box"],
  }),
  p({
    id: "p-002", sku: "KS-MED-1002", name: "Surgical Face Masks — 3-Ply Disposable", brand: "Kimberly-Clark", category: "medical-safety", categoryName: "Medical Safety",
    price: 950, oldPrice: 1200, stock: 1200, lowStockAt: 100, rating: 4.7, reviews: 158, sold: 12300, model: "KF94-Class 3ply", featured: true,
    tags: ["medical", "masks", "disposable"], material: "Non-woven PP + meltblown", size: "Adult · Child", color: "Blue",
    certification: "EN 14683 Type IIR", standard: "ISO 13485", country: "Kenya (locally assembled)", warranty: "Non-warrantable consumable",
    description: "3-ply disposable surgical masks with 99% bacterial filtration efficiency (BFE). Soft ear loops, adjustable nose bridge and breathable meltblown filtration layer. Box of 50.",
    features: ["99% bacterial filtration efficiency", "3-ply construction with meltblown layer", "Hypoallergenic and breathable", "50 pieces per box", "Nose bridge with adjustable wire"],
  }),
  p({
    id: "p-003", sku: "KS-IND-2001", name: "Vanguard Safety Helmet — White", brand: "3M", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1350, oldPrice: 1650, stock: 340, lowStockAt: 40, rating: 4.8, reviews: 326, sold: 9800, model: "3M H-700", featured: true, bestSeller: true,
    tags: ["helmet", "construction", "industrial"], material: "HDPE shell + ABS", size: "Adjustable 52–64 cm", weight: "380 g", color: "White",
    certification: "EN 397 · KSA 1559", standard: "EN 397", country: "USA",
    description: "High-performance safety helmet with 6-point ratchet suspension, sweatband and optional accessory slots for visors and ear muffs. Meets EN 397 industrial head protection requirements and complies with Kenyan workplace safety standards.",
    features: ["EN 397 certified industrial impact protection", "6-point ratchet suspension for all-day comfort", "Accessory slots for visors and ear muffs", "High-visibility finishes available", "UV-stabilized shell for outdoor use"],
  }),
  p({
    id: "p-004", sku: "KS-IND-2002", name: "GripTech Steel-Toe Work Boots", brand: "Karam", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 4850, oldPrice: 5800, stock: 96, lowStockAt: 25, rating: 4.7, reviews: 189, sold: 3400, model: "KS-8221", featured: true,
    tags: ["boots", "construction", "foot protection"], material: "Full-grain leather + PU sole", size: "38 – 47 EU", weight: "1.4 kg / pair", color: "Black",
    certification: "EN ISO 20345 S1P", standard: "EN ISO 20345", country: "India",
    description: "Full-grain leather work boots with steel toe caps, anti-penetration midsoles and slip-resistant PU outsoles. Breathable lining keeps feet dry through long shifts on site.",
    features: ["Steel toe cap — 200 J impact protection", "Anti-penetration midsole", "Slip-resistant PU outsole (SRC)", "Electrical hazard protection", "Shock-absorbing heel"],
  }),
  p({
    id: "p-005", sku: "KS-PPE-3001", name: "Nova Shield Half-Mask Respirator", brand: "3M", category: "ppe", categoryName: "PPE",
    price: 2950, oldPrice: 3500, stock: 210, lowStockAt: 30, rating: 4.9, reviews: 275, sold: 5600, model: "3M 6500QL", featured: true, bestSeller: true,
    tags: ["respirator", "dust", "chemical"], material: "TPE + PP", size: "S · M · L", weight: "180 g", color: "Grey",
    certification: "EN 140", standard: "EN 149 FFP2", country: "USA",
    description: "Comfortable half-mask respirator with quick-release buckles, low-profile design for use with goggles, and compatibility with a wide range of filters and cartridges. Ideal for dust, fumes and chemical exposure.",
    features: ["Quick-release buckle system", "Compatible with bayonet filters (A2, P3)", "Soft TPE face seal — no pressure points", "Low-profile for use under goggles", "Meets EN 140 requirements"],
  }),
  p({
    id: "p-006", sku: "KS-PPE-3002", name: "FlexiGlove Nitrile Work Gloves (Pair)", brand: "Ansell", category: "ppe", categoryName: "PPE",
    price: 750, oldPrice: 950, stock: 640, lowStockAt: 60, rating: 4.6, reviews: 142, sold: 15000, model: "HyFlex 11-800",
    tags: ["gloves", "nitrile", "mechanical"], material: "Nitrile-coated knitted", size: "7 – 11", weight: "45 g / pair", color: "Black / Grey",
    certification: "EN 388 4141", standard: "EN 388", country: "Malaysia",
    description: "Durable nitrile-coated work gloves offering excellent grip in oily and dry conditions. Breathable knitted back keeps hands cool during repetitive handling tasks.",
    features: ["Oil-resistant nitrile coating", "Excellent dry & oily grip (EN 388 4141)", "Breathable 18-gauge knitted liner", "Machine washable", "High dexterity — 4X puncture class"],
  }),
  p({
    id: "p-007", sku: "KS-FIR-4001", name: "FireGuard 6kg ABC Dry Powder Extinguisher", brand: "MSA", category: "fire-safety", categoryName: "Fire Safety",
    price: 9800, oldPrice: 11500, stock: 64, lowStockAt: 15, rating: 4.8, reviews: 96, sold: 2100, model: "ABC-6", featured: true, bestSeller: true,
    tags: ["fire", "extinguisher", "abc"], material: "Seamless steel cylinder", size: "6 kg · 4 kg · 9 kg", weight: "9.8 kg", color: "Red",
    certification: "KEBS · EN 3", standard: "EN 3-7", country: "UAE", warranty: "3-year cylinder warranty",
    description: "6 kg ABC dry powder extinguisher with pressure gauge, wall bracket and hose. Fights Class A (wood/paper), Class B (flammable liquids) and Class C (electrical) fires. Supplied with wall mounting bracket and pin seal intact.",
    features: ["Multipurpose A, B & C class coverage", "KEBS & EN 3 certified", "Pressure gauge with inspection seal", "Wall bracket included", "Free fire safety checklist with every order"],
  }),
  p({
    id: "p-008", sku: "KS-FIR-4002", name: "SmartAlert Optical Smoke Detector", brand: "Honeywell", category: "fire-safety", categoryName: "Fire Safety",
    price: 2850, oldPrice: 3300, stock: 140, lowStockAt: 20, rating: 4.5, reviews: 88, sold: 3200, model: "HD-3",
    tags: ["fire", "detector", "smoke"], material: "ABS", size: "110 mm dia", weight: "210 g", color: "White",
    certification: "EN 14604", standard: "EN 14604", country: "USA", warranty: "24-month warranty",
    description: "Optical smoke detector with 85 dB alarm, low-battery warning and test button. Battery powered — no wiring required. CE and EN 14604 certified for home and office use.",
    features: ["85 dB loud alarm", "9V battery — lasts 12+ months", "Test and low-battery indicators", "No wiring required", "EN 14604 certified"],
  }),
  p({
    id: "p-009", sku: "KS-ROA-5001", name: "TrafficPro Reflective Traffic Cone 750mm", brand: "Karam", category: "road-safety", categoryName: "Road Safety",
    price: 1450, oldPrice: 1700, stock: 380, lowStockAt: 50, rating: 4.7, reviews: 121, sold: 7500, model: "TC-75",
    tags: ["traffic", "cone", "road"], material: "Flexible PVC", size: "750 mm · 1 m", weight: "2.1 kg", color: "Orange / White",
    certification: "KEBS", standard: "KeNHA spec", country: "Kenya (assembled)",
    description: "Heavy-duty reflective traffic cone with high-visibility white reflective collars, stable square base and UV-stabilized PVC body. Conforms to KeNHA temporary works specification.",
    features: ["2 white reflective collars — visible at night", "Stable weighted base resists wind", "UV-stabilized PVC won't fade", "Stackable for storage", "KeNHA compliant"],
  }),
  p({
    id: "p-010", sku: "KS-ROA-5002", name: "HiVis Class 2 Reflective Vest — Orange", brand: "3M", category: "road-safety", categoryName: "Road Safety",
    price: 650, oldPrice: 800, stock: 720, lowStockAt: 80, rating: 4.6, reviews: 233, sold: 22000, model: "RV-2", featured: true, bestSeller: true,
    tags: ["vest", "reflective", "hi-vis"], material: "Polyester mesh", size: "S – 3XL", weight: "180 g", color: "Orange",
    certification: "EN ISO 20471 Class 2", standard: "EN ISO 20471", country: "Vietnam",
    description: "Class 2 high-visibility reflective vest with 3M Scotchlite retro-reflective tape. Breathable polyester mesh keeps workers cool. Perfect for road crews, security and warehouse staff.",
    features: ["EN ISO 20471 Class 2 certified", "3M Scotchlite reflective tape", "Breathable mesh — cool to wear", "Zipper front with snap closure", "Machine washable"],
  }),
  p({
    id: "p-011", sku: "KS-CON-6001", name: "HarnessMax Full-Body Fall Arrest Harness", brand: "MSA", category: "construction-safety", categoryName: "Construction Safety",
    price: 8900, oldPrice: 10400, stock: 48, lowStockAt: 12, rating: 4.8, reviews: 87, sold: 1400, model: "V-FORM", featured: true,
    tags: ["harness", "fall protection", "height"], material: "Polyester webbing + alloy D-rings", size: "M · L · XL", weight: "1.6 kg", color: "Navy",
    certification: "EN 361", standard: "EN 361:2002", country: "USA",
    description: "Full-body fall arrest harness with dual dorsal D-ring, padded shoulder straps and quick-connect buckles. EN 361 certified for working at height in construction and maintenance.",
    features: ["EN 361 certified fall arrest system", "Padded shoulders and legs for comfort", "Dual dorsal + chest D-rings", "Quick-connect buckles", "Load indicator on dorsal ring"],
  }),
  p({
    id: "p-012", sku: "KS-LAB-7001", name: "ProLab Binocular Microscope 40x–1000x", brand: "Honeywell", category: "laboratory-equipment", categoryName: "Laboratory Equipment",
    price: 28500, oldPrice: 32000, stock: 18, lowStockAt: 5, rating: 4.9, reviews: 54, sold: 320, model: "BS-301", featured: true,
    tags: ["microscope", "lab", "school"], material: "Metal frame + glass optics", size: "340 × 210 × 400 mm", weight: "4.8 kg", color: "Grey",
    certification: "ISO 9001", standard: "ISO 9001", country: "China", warranty: "24-month warranty",
    description: "Binocular compound microscope with 4 objective lenses, 40x to 1000x magnification, LED illumination and mechanical stage. Ideal for schools, universities and clinical labs.",
    features: ["4-objective turret 40x – 1000x", "LED bright-field illumination", "Mechanical stage for precise movement", "Metal body — durable for classroom use", "24-month warranty"],
  }),
  p({
    id: "p-013", sku: "KS-CLN-8001", name: "Sanix Professional Disinfectant 5L", brand: "Kimberly-Clark", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 1950, oldPrice: 2400, stock: 260, lowStockAt: 30, rating: 4.6, reviews: 97, sold: 6800, model: "SD-5L",
    tags: ["cleaning", "disinfectant", "hygiene"], material: "Quaternary ammonium solution", size: "5 L · 20 L", weight: "5.2 kg", color: "Green",
    certification: "KEBS · EPA", standard: "EN 14476", country: "Kenya (locally blended)",
    description: "Hospital-grade disinfectant effective against bacteria, viruses and fungi. 5-litre container with measuring cap — suitable for floors, surfaces and equipment in healthcare and hospitality.",
    features: ["Kills 99.99% of bacteria & viruses", "EN 14476 virucidal claim", "Dilutes 1:50 for general cleaning", "Suitable for healthcare facilities", "Locally blended — KeBS certified"],
  }),
  p({
    id: "p-014", sku: "KS-EMR-9001", name: "RescuePro 25-Piece First Aid Kit", brand: "MSA", category: "emergency-response", categoryName: "Emergency Response",
    price: 3900, oldPrice: 4600, stock: 150, lowStockAt: 25, rating: 4.8, reviews: 164, sold: 5200, model: "FAK-25", featured: true, bestSeller: true,
    tags: ["first aid", "kit", "workplace"], material: "ABS case + medical contents", size: "250 × 170 × 90 mm", weight: "1.1 kg", color: "Green",
    certification: "KeBS · WHO kit listing", standard: "WHO Emergency Kit", country: "Kenya (assembled)",
    description: "Comprehensive 25-piece first aid kit in a durable carry case — plasters, bandages, antiseptic, scissors, gloves and CPR mask. Complies with Kenyan workplace first aid requirements for teams up to 25 people.",
    features: ["25 essential items for teams up to 25", "Wall-mountable ABS case", "Contents checked & sealed — expiry dated", "Suitable for offices, sites & workshops", "Restock service available"],
  }),
  p({
    id: "p-015", sku: "KS-MAR-1001", name: "AquaGuard 150N Life Jacket", brand: "Delta Plus", category: "marine-safety", categoryName: "Marine Safety",
    price: 4250, oldPrice: 5000, stock: 72, lowStockAt: 15, rating: 4.7, reviews: 63, sold: 1100, model: "LJ-150", featured: true,
    tags: ["marine", "life jacket", "safety"], material: "PVC coated nylon + foam", size: "Universal", weight: "900 g", color: "Orange",
    certification: "SOLAS · EN ISO 12402-2", standard: "EN ISO 12402-2", country: "China",
    description: "150N buoyancy life jacket with whistle, retro-reflective strips and crotch strap. Approved for coastal, lake and river use — certified to SOLAS and EN ISO 12402-2.",
    features: ["150N buoyancy — SOLAS approved", "Retro-reflective strips for night rescue", "Whistle and crotch strap included", "Adult universal size", "5-year foam life"],
  }),
  p({
    id: "p-016", sku: "KS-SEC-1101", name: "WatchTower 2MP CCTV Dome Camera", brand: "Honeywell", category: "security-equipment", categoryName: "Security Equipment",
    price: 6800, oldPrice: 7900, stock: 85, lowStockAt: 15, rating: 4.5, reviews: 118, sold: 2600, model: "HDC-2MP", featured: true,
    tags: ["cctv", "security", "camera"], material: "Aluminium + polycarbonate", size: "110 mm", weight: "400 g", color: "White",
    certification: "CE · FCC", standard: "IP66", country: "China", warranty: "24-month warranty",
    description: "2MP HD dome CCTV camera with IR night vision up to 30 m, IP66 weatherproof housing and built-in microphone. Ideal for stores, offices and perimeter monitoring.",
    features: ["2MP 1080p resolution", "30 m IR night vision", "IP66 weatherproof", "Built-in microphone", "Compatible with NVR & mobile app"],
  }),
  p({
    id: "p-017", sku: "KS-FOO-1201", name: "FoodSafe Vinyl Food Handling Gloves (Box of 100)", brand: "Ansell", category: "food-safety", categoryName: "Food Safety",
    price: 1150, oldPrice: 1400, stock: 310, lowStockAt: 40, rating: 4.5, reviews: 76, sold: 8900, model: "FG-100",
    tags: ["food", "gloves", "kitchen"], material: "Food-grade vinyl", size: "S · M · L", weight: "260 g / box", color: "Clear",
    certification: "FDA 21 CFR 177", standard: "EN 1186", country: "Thailand",
    description: "Clear, powder-free vinyl gloves certified for food handling. Ideal for catering, restaurants, food processing and home kitchens. Box of 100.",
    features: ["FDA certified food contact", "Powder-free — no contamination", "Clear, low-profile fit", "100 pieces per box", "Latex-free option"],
  }),
  p({
    id: "p-018", sku: "KS-SIG-1301", name: "ExitMaster Photoluminescent Exit Sign", brand: "Honeywell", category: "signs-labels", categoryName: "Signs & Labels",
    price: 850, oldPrice: 1000, stock: 240, lowStockAt: 30, rating: 4.6, reviews: 92, sold: 5100, model: "ES-220",
    tags: ["signage", "exit", "emergency"], material: "Photoluminescent PVC", size: "400 × 150 mm", weight: "300 g", color: "Green",
    certification: "ISO 7010", standard: "ISO 7010:2019", country: "China",
    description: "Photoluminescent emergency exit sign that glows in darkness without power. Self-adhesive backing for quick installation on doors, corridors and stairwells.",
    features: ["Glows up to 8 hours in darkness", "ISO 7010 approved pictogram", "Self-adhesive — no tools needed", "Fire-resistant PVC", "No wiring or batteries"],
  }),
  p({
    id: "p-019", sku: "KS-IND-2003", name: "SafEyes Chemical Splash Goggles", brand: "Uvex", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1100, oldPrice: 1350, stock: 195, lowStockAt: 30, rating: 4.7, reviews: 148, sold: 7200, model: "9302-260", featured: true,
    tags: ["goggles", "eye protection", "chemical"], material: "Polycarbonate lens + PVC frame", size: "Universal", weight: "110 g", color: "Clear",
    certification: "EN 166", standard: "EN 166:2001", country: "Germany",
    description: "Chemical splash goggles with anti-fog polycarbonate lens, indirect ventilation and adjustable strap. Fits over prescription glasses — certified EN 166 for impact and splash protection.",
    features: ["EN 166 certified impact + splash", "Anti-fog coated lens", "Fits over prescription spectacles", "Indirect ventilation — no fog build-up", "UV 400 protection"],
  }),
  p({
    id: "p-020", sku: "KS-PPE-3003", name: "EarGuard Pro Ear Muffs SNR 31dB", brand: "3M", category: "ppe", categoryName: "PPE",
    price: 1900, oldPrice: 2300, stock: 130, lowStockAt: 20, rating: 4.6, reviews: 87, sold: 3100, model: "X4A", featured: true,
    tags: ["hearing", "ear muffs", "noise"], material: "ABS + PU foam cushions", size: "Universal", weight: "300 g", color: "Grey / Green",
    certification: "EN 352-1", standard: "EN 352-1:2002", country: "USA",
    description: "High-performance ear muffs with 31 dB noise reduction for saws, mills, workshops and industrial environments. Replaceable cushions and headband for long service life.",
    features: ["SNR 31 dB protection", "Electrically insulated headband (EN 352-1)", "Replaceable hygiene kits", "Foldable for storage", "Suitable for workshops & industry"],
  }),
  p({
    id: "p-021", sku: "KS-MED-1003", name: "MedTech Digital Thermometer", brand: "Dräger", category: "medical-safety", categoryName: "Medical Safety",
    price: 750, oldPrice: 900, stock: 420, lowStockAt: 50, rating: 4.4, reviews: 65, sold: 9800, model: "DT-101",
    tags: ["medical", "thermometer", "fever"], material: "ABS + stainless tip", size: "140 mm", weight: "35 g", color: "White",
    certification: "CE · ISO 80601", standard: "ISO 80601-2-56", country: "China", warranty: "12-month warranty",
    description: "Digital clinical thermometer with 30-second reading, flexible tip, fever alarm and waterproof body. Supplied with protective case and battery.",
    features: ["Reads in 30 seconds", "Flexible waterproof tip", "Fever alarm at 37.5°C", "Memory of last reading", "Battery included"],
  }),
  p({
    id: "p-022", sku: "KS-IND-2004", name: "FlexFit HiVis Coverall — Navy", brand: "Delta Plus", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 3400, oldPrice: 4000, stock: 76, lowStockAt: 15, rating: 4.5, reviews: 54, sold: 1900, model: "CV-202",
    tags: ["coverall", "workwear", "overall"], material: "65% polyester / 35% cotton twill", size: "S – 4XL", weight: "900 g", color: "Navy",
    certification: "EN ISO 13688", standard: "EN ISO 13688", country: "Bangladesh",
    description: "Hard-wearing work coverall with two-way front zip, chest and leg pockets, and reinforced knees. Wrinkle-resistant twill fabric with reflective trim for visibility.",
    features: ["EN ISO 13688 general clothing standard", "Reinforced knees & double stitching", "6 pockets including chest pockets", "Reflective trim for visibility", "Industrial wash durable"],
  }),
  p({
    id: "p-023", sku: "KS-ELC-1401", name: "VoltSafe Class 0 Insulated Gloves (Pair)", brand: "3M", category: "electrical-safety", categoryName: "Electrical Safety",
    price: 5200, oldPrice: 6000, stock: 42, lowStockAt: 10, rating: 4.8, reviews: 39, sold: 700, model: "IG-0", featured: true,
    tags: ["electrical", "insulated", "gloves"], material: "Natural rubber", size: "9 – 11", weight: "300 g / pair", color: "Black",
    certification: "EN 60903", standard: "IEC 60903 Class 0", country: "USA",
    description: "Class 0 electrical-insulating gloves rated for working voltages up to 1,000 V AC. Supplied with leather protectors and carrying bag. IEC 60903 certified.",
    features: ["Class 0 — up to 1,000 V AC", "IEC 60903 / EN 60903 certified", "Leather protector gloves included", "Air test every 6 months recommended", "Sizes 9 to 11"],
  }),
  p({
    id: "p-024", sku: "KS-ELC-1402", name: "InsulTool VDE Insulated Screwdriver Set (6pc)", brand: "Honeywell", category: "electrical-safety", categoryName: "Electrical Safety",
    price: 2450, oldPrice: 2900, stock: 90, lowStockAt: 15, rating: 4.6, reviews: 71, sold: 2600, model: "VDE-6", featured: true,
    tags: ["electrical", "tools", "screwdriver"], material: "Chrome-vanadium steel + insulated PP", size: "6-piece set", weight: "650 g", color: "Red / Black",
    certification: "IEC 60900", standard: "IEC 60900 / EN 60900", country: "Taiwan",
    description: "VDE 1000V insulated screwdriver set — slotted, Phillips and Pozidriv heads with individually tested insulation. Colour-coded for instant voltage identification.",
    features: ["1000V insulated — IEC 60900 tested", "6 pieces: 3 slotted, 2 Phillips, 1 Pozidriv", "Colour-coded insulation", "Magnetic tips", "Glow-in-dark handles"],
  }),
  p({
    id: "p-025", sku: "KS-IND-2005", name: "ThermoGuard HiVis Winter Jacket", brand: "Karam", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 3900, oldPrice: 4700, stock: 58, lowStockAt: 12, rating: 4.4, reviews: 44, sold: 1500, model: "WJ-30",
    tags: ["jacket", "cold weather", "hi-vis"], material: "Oxford polyester + thermal lining", size: "S – 4XL", weight: "1.2 kg", color: "Orange / Navy",
    certification: "EN ISO 20471", standard: "EN ISO 20471 Class 2", country: "India",
    description: "Water-resistant hi-vis winter jacket with detachable thermal lining and reflective stripes. Ideal for security, night crews and cold-store work.",
    features: ["Class 2 reflective tape", "Detachable thermal inner layer", "Water-resistant oxford shell", "Zip + press-stud storm flap", "2-way side pockets"],
  }),
  p({
    id: "p-026", sku: "KS-ROA-5003", name: "BarrierLite Water-Filled Road Barrier", brand: "Karam", category: "road-safety", categoryName: "Road Safety",
    price: 12500, oldPrice: 14500, stock: 36, lowStockAt: 8, rating: 4.5, reviews: 32, sold: 540, model: "WB-2",
    tags: ["barrier", "road", "traffic"], material: "UV-stabilized HDPE", size: "2 m", weight: "11 kg empty / 110 kg filled", color: "Orange / White",
    certification: "KeNHA", standard: "KeNHA temporary works", country: "Kenya (assembled)",
    description: "2-metre water-filled traffic barrier that interlinks to create continuous separation. Fill with water on site for instant 110 kg stability, drains flat for transport.",
    features: ["Interlocking 2 m sections", "110 kg water ballast stability", "Reflective strips both sides", "Stackable for truck transport", "Ideal for detours & lanes"],
  }),
  p({
    id: "p-027", sku: "KS-FIR-4003", name: "FireBlanket Pro 1.8m Kitchen Fire Blanket", brand: "Honeywell", category: "fire-safety", categoryName: "Fire Safety",
    price: 2800, oldPrice: 3300, stock: 110, lowStockAt: 20, rating: 4.6, reviews: 48, sold: 1900, model: "FB-180",
    tags: ["fire", "blanket", "kitchen"], material: "Fiberglass woven", size: "1.8 m × 1.8 m", weight: "1.4 kg", color: "Red case",
    certification: "EN 1869", standard: "EN 1869:2019", country: "China",
    description: "Fire blanket in wall-mountable quick-release case. Smothers small cooking and clothing fires without residue — ideal for kitchens, canteens and labs.",
    features: ["1.8 m × 1.8 m fiberglass weave", "EN 1869 certified", "Wall-mount quick-release case", "No residue cleanup", "Reusable after inspection"],
  }),
  p({
    id: "p-028", sku: "KS-LAB-7002", name: "LabGuard Safety Glasses — Clear", brand: "Uvex", category: "laboratory-equipment", categoryName: "Laboratory Equipment",
    price: 850, oldPrice: 1000, stock: 300, lowStockAt: 40, rating: 4.7, reviews: 105, sold: 8700, model: "9301-171",
    tags: ["lab", "goggles", "eye protection"], material: "Polycarbonate", size: "Universal", weight: "28 g", color: "Clear",
    certification: "EN 166", standard: "EN 166F", country: "Germany",
    description: "Ultra-light impact-resistant safety glasses with anti-fog coating and wrap-around coverage. Comfortable for all-day lab and workshop wear.",
    features: ["Impact-resistant polycarbonate", "Anti-fog coating", "Wrap-around side protection", "28 g — feather-light", "Fits over most prescription frames"],
  }),
  p({
    id: "p-029", sku: "KS-MED-1004", name: "Medical Disposable Isolation Gowns (Box of 50)", brand: "Kimberly-Clark", category: "medical-safety", categoryName: "Medical Safety",
    price: 6800, oldPrice: 8000, stock: 88, lowStockAt: 15, rating: 4.7, reviews: 59, sold: 2100, model: "IG-50",
    tags: ["medical", "gown", "isolation"], material: "SMS non-woven", size: "M · L · XL", weight: "4.5 kg / box", color: "Blue",
    certification: "EN 13795", standard: "EN 13795", country: "Kenya (assembled)",
    description: "Disposable isolation gowns in fluid-resistant SMS fabric with elastic cuffs and tie closure. Supplied sterile in boxes of 50 for clinics, hospitals and labs.",
    features: ["Fluid-resistant SMS fabric", "Elastic cuffs and neck ties", "EN 13795 certified", "50 per box", "Comfortable soft-touch fabric"],
  }),
  p({
    id: "p-030", sku: "KS-CON-6002", name: "SiteSafe Heavy-Duty Knee Pads", brand: "Karam", category: "construction-safety", categoryName: "Construction Safety",
    price: 950, oldPrice: 1200, stock: 170, lowStockAt: 25, rating: 4.4, reviews: 67, sold: 4300, model: "KP-01",
    tags: ["knee pads", "construction", "protection"], material: "EVA foam + nylon shell", size: "Universal", weight: "380 g", color: "Black / Orange",
    certification: "EN 14404", standard: "EN 14404", country: "India",
    description: "Heavy-duty knee pads with thick EVA foam core, water-repellent nylon shell and adjustable elastic straps. Comfortable for tiling, flooring and ductwork.",
    features: ["EN 14404 certified knee protection", "25 mm thick EVA cushioning", "Slip-resistant straps", "Water-repellent outer shell", "Universal fit"],
  }),
  p({
    id: "p-031", sku: "KS-EMR-9002", name: "SurviveAl Emergency Thermal Blanket (5-pack)", brand: "MSA", category: "emergency-response", categoryName: "Emergency Response",
    price: 1200, oldPrice: 1500, stock: 260, lowStockAt: 40, rating: 4.5, reviews: 38, sold: 3600, model: "TB-5",
    tags: ["blanket", "emergency", "thermal"], material: "Aluminized mylar", size: "160 × 210 cm", weight: "75 g each", color: "Silver",
    certification: "ISO 9001", standard: "ISO 9001", country: "China",
    description: "Emergency thermal blankets that retain up to 90% of body heat. Compact 75 g packs fit in any first aid kit, vehicle or survival bag. Pack of 5.",
    features: ["Reflects 90% of body heat", "Waterproof and windproof", "Compact — fits in a pocket", "5 per pack", "Ideal for vehicles & kits"],
  }),
  p({
    id: "p-032", sku: "KS-IND-2006", name: "DuraFlex General Purpose Work Gloves (12 pairs)", brand: "Ansell", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1650, oldPrice: 1950, stock: 410, lowStockAt: 60, rating: 4.5, reviews: 156, sold: 12000, model: "GP-12",
    tags: ["gloves", "work", "general"], material: "Cotton jersey + PVC dots", size: "M · L · XL", weight: "1.5 kg / dozen", color: "Grey",
    certification: "EN 388", standard: "EN 388 2121", country: "India",
    description: "All-purpose work gloves with PVC-dotted palm for grip. Tough, breathable cotton construction at unbeatable value. Sold in dozens for crews.",
    features: ["PVC dotted palm — extra grip", "Breathable cotton jersey", "Machine washable", "12 pairs per order", "Best value for crews"],
  }),
  p({
    id: "p-033", sku: "KS-PPE-3004", name: "PureFlow Disposable Dust Masks FFP2 (Box of 20)", brand: "3M", category: "ppe", categoryName: "PPE",
    price: 1550, oldPrice: 1900, stock: 530, lowStockAt: 60, rating: 4.6, reviews: 188, sold: 16500, model: "9320+", featured: true,
    tags: ["mask", "dust", "ffp2"], material: "Non-woven PP + meltblown", size: "One size", weight: "240 g / box", color: "White",
    certification: "EN 149 FFP2", standard: "EN 149:2001+A1:2009", country: "USA",
    description: "FFP2 disposable respirators with 94% filtration efficiency against dust, smoke and aerosols. Fold-flat design with exhalation valve for comfort. Box of 20.",
    features: ["EN 149 FFP2 — 94% filtration", "Exhalation valve reduces heat", "Fold-flat storage design", "Adjustable nose clip", "20 per box"],
  }),
  p({
    id: "p-034", sku: "KS-ROA-5004", name: "RoadStar LED Warning Flashlight", brand: "Honeywell", category: "road-safety", categoryName: "Road Safety",
    price: 1100, oldPrice: 1350, stock: 200, lowStockAt: 30, rating: 4.3, reviews: 57, sold: 4200, model: "FL-27",
    tags: ["flashlight", "warning", "night"], material: "Aluminium body", size: "160 mm", weight: "180 g", color: "Orange",
    certification: "CE", standard: "IPX4", country: "China", warranty: "12-month warranty",
    description: "3-mode LED flashlight (spot / strobe / SOS) with orange warning body. Water-resistant and shock-proof — built for night worksites and security patrols.",
    features: ["3 modes: spot, strobe, SOS", "300 lm output", "IPX4 water resistance", "3×AA batteries (included)", "Aluminium shock-proof body"],
  }),
  p({
    id: "p-035", sku: "KS-CLN-8002", name: "ComfortGrip Heavy-Duty Cleaning Gloves (Pair)", brand: "Ansell", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 450, oldPrice: 550, stock: 350, lowStockAt: 50, rating: 4.4, reviews: 74, sold: 11000, model: "HD-06",
    tags: ["cleaning", "gloves", "rubber"], material: "Natural rubber", size: "M · L · XL", weight: "260 g / pair", color: "Yellow",
    certification: "EN 374", standard: "EN 374-1", country: "Malaysia",
    description: "Reusable heavy-duty cleaning gloves with flocked lining and textured grip. Protects hands from detergents, disinfectants and hot water.",
    features: ["Flocked cotton lining", "Textured grip palm", "Chemical-resistant (EN 374)", "Machine washable", "12 pairs per carton available"],
  }),
  p({
    id: "p-036", sku: "KS-SIG-1302", name: "WarningLite Hazard Warning Sign — Danger", brand: "Karam", category: "signs-labels", categoryName: "Signs & Labels",
    price: 550, oldPrice: 700, stock: 280, lowStockAt: 40, rating: 4.5, reviews: 46, sold: 6000, model: "WS-300",
    tags: ["signage", "warning", "hazard"], material: "PVC + UV ink", size: "300 × 400 mm", weight: "350 g", color: "Yellow",
    certification: "ISO 7010", standard: "ISO 7010 W001", country: "Kenya (printed)",
    description: "ISO 7010 'General Warning' danger sign with self-adhesive or screw mounting. UV-stable inks for outdoor durability. Custom text available for bulk orders.",
    features: ["ISO 7010 compliant symbols", "UV-resistant outdoor inks", "Self-adhesive or screw fixing", "600 gsm rigid PVC", "Customization for bulk orders"],
  }),
  p({
    id: "p-037", sku: "KS-LAB-7003", name: "ChemShield Laboratory Apron", brand: "Delta Plus", category: "laboratory-equipment", categoryName: "Laboratory Equipment",
    price: 1650, oldPrice: 2000, stock: 95, lowStockAt: 15, rating: 4.6, reviews: 43, sold: 2100, model: "LA-01",
    tags: ["lab", "apron", "chemical"], material: "PVC coated polyester", size: "Universal", weight: "600 g", color: "Transparent",
    certification: "EN 14605", standard: "EN 14605", country: "France",
    description: "Chemical splash-resistant laboratory apron with bib and waist ties. Easy to wipe clean — the essential last line of defense in any lab.",
    features: ["EN 14605 splash protection", "Wipe-clean PVC surface", "Bib + waist fastening", "Full torso coverage", "Wear over lab coats"],
  }),
  p({
    id: "p-038", sku: "KS-EMR-9003", name: "FirstAid Responder Stretcher — Foldable", brand: "MSA", category: "emergency-response", categoryName: "Emergency Response",
    price: 9500, oldPrice: 11000, stock: 22, lowStockAt: 6, rating: 4.7, reviews: 28, sold: 480, model: "FS-200",
    tags: ["stretcher", "first aid", "rescue"], material: "Aluminium + PVC canvas", size: "190 × 55 cm folded 95 cm", weight: "7 kg", color: "Green",
    certification: "CE", standard: "EN 1865", country: "China",
    description: "Folding aluminium stretcher with PVC canvas, 2 safety straps and carrying handles. Deploys in under 10 seconds — ideal for clinics, sites and rescue teams.",
    features: ["Deploys in under 10 seconds", "Load capacity 160 kg", "2 securing straps included", "Folds to half length", "EN 1865 certified"],
  }),
  p({
    id: "p-039", sku: "KS-FOO-1202", name: "TempGuard Digital Food Thermometer", brand: "Honeywell", category: "food-safety", categoryName: "Food Safety",
    price: 1950, oldPrice: 2400, stock: 140, lowStockAt: 25, rating: 4.5, reviews: 61, sold: 3200, model: "FT-06",
    tags: ["food", "thermometer", "kitchen"], material: "Stainless steel probe", size: "200 mm", weight: "90 g", color: "Black",
    certification: "NSF", standard: "NSF / FDA approved", country: "China",
    description: "Instant-read digital food thermometer with 2–3 second response, fold-away probe and IP67 waterproof rating. Perfect for HACCP compliance in kitchens.",
    features: ["2–3 second response time", "IP67 waterproof body", "Fold-away stainless probe", "Backlit display", "HACCP temperature guides"],
  }),
  p({
    id: "p-040", sku: "KS-TOOL-1501", name: "ProGrip Insulated Side-Cutting Pliers 200mm", brand: "Honeywell", category: "tools", categoryName: "Tools",
    price: 2100, oldPrice: 2500, stock: 120, lowStockAt: 20, rating: 4.6, reviews: 52, sold: 1800, model: "PL-200",
    tags: ["tools", "pliers", "insulated"], material: "Chrome-vanadium steel", size: "200 mm", weight: "320 g", color: "Red / Black",
    certification: "IEC 60900", standard: "IEC 60900 / EN 60900", country: "Taiwan",
    description: "1000V insulated side-cutting pliers with comfort-grip handles and induction-hardened cutting edges. Every tool individually tested to IEC 60900.",
    features: ["1000V insulation — IEC 60900", "Induction-hardened blades", "Ergonomic non-slip grip", "200 mm length", "Lifetime handle warranty"],
  }),
  p({
    id: "p-041", sku: "KS-IND-2007", name: "VisionPro Adjustable Face Shield", brand: "Uvex", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1600, oldPrice: 1900, stock: 150, lowStockAt: 25, rating: 4.5, reviews: 66, sold: 3900, model: "9431-021", featured: true,
    tags: ["face shield", "protection", "visor"], material: "PETG visor + ABS frame", size: "Universal", weight: "180 g", color: "Clear",
    certification: "EN 166", standard: "EN 166:2001", country: "Germany",
    description: "Comfortable face shield with ratchet headband and anti-fog PETG visor. Full-face protection against splashes, sparks and impacts.",
    features: ["Ratchet-fit headband", "Anti-fog PETG visor", "Full-face splash & impact cover", "Replaceable visor", "Wear over glasses"],
  }),
  p({
    id: "p-042", sku: "KS-MED-1005", name: "SafeSharps Puncture-Proof Sharps Container 2L", brand: "Kimberly-Clark", category: "medical-safety", categoryName: "Medical Safety",
    price: 750, oldPrice: 900, stock: 310, lowStockAt: 45, rating: 4.8, reviews: 84, sold: 7800, model: "SC-02",
    tags: ["medical", "sharps", "disposal"], material: "PP puncture-resistant", size: "2 L · 5 L · 10 L", weight: "250 g", color: "Yellow",
    certification: "ISO 23907", standard: "ISO 23907", country: "Kenya (assembled)",
    description: "Puncture-proof sharps container with secure snap-lock lid and carrying handle. Complies with healthcare waste disposal regulations. Box of 20.",
    features: ["ISO 23907 puncture resistant", "Snap-lock tamper-proof lid", "Clear fill-level window", "Autoclavable up to 134°C", "20 per carton"],
  }),
  p({
    id: "p-043", sku: "KS-CON-6003", name: "LineWatch Horizontal Safety Lifeline Kit", brand: "MSA", category: "construction-safety", categoryName: "Construction Safety",
    price: 28500, oldPrice: 32000, stock: 12, lowStockAt: 4, rating: 4.9, reviews: 21, sold: 150, model: "HL-20",
    tags: ["lifeline", "fall protection", "height"], material: "Galvanized steel + polyester", size: "20 m", weight: "9 kg", color: "Navy",
    certification: "EN 795", standard: "EN 795:2012", country: "USA",
    description: "Complete 20 m horizontal lifeline kit with two anchorage connectors, energy absorber and tensioner. Enables safe movement across rooftops and mezzanines.",
    features: ["EN 795 certified anchorage", "20 m galvanized steel cable", "Energy absorber for 6 kN limit", "Tensioner with indicator", "Includes 2 anchorage connectors"],
  }),
  p({
    id: "p-044", sku: "KS-MAR-1002", name: "SeaSafe Throwable Lifebuoy Ring", brand: "Delta Plus", category: "marine-safety", categoryName: "Marine Safety",
    price: 2900, oldPrice: 3400, stock: 60, lowStockAt: 12, rating: 4.6, reviews: 31, sold: 800, model: "LB-76",
    tags: ["marine", "lifebuoy", "rescue"], material: "Closed-cell foam + rope", size: "760 mm", weight: "2.6 kg", color: "Orange",
    certification: "SOLAS", standard: "SOLAS 74", country: "China",
    description: "SOLAS-approved lifebuoy with grab lines and retro-reflective tape. Self-buoyant closed-cell foam that never needs inflation.",
    features: ["SOLAS approved", "760 mm diameter", "Grab line + reflective tape", "Self-buoyant foam core", "Ships with throwing line option"],
  }),
  p({
    id: "p-216", sku: "KS-CLN-8003", name: "Chemical Spill Kit 28L (Bag)", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 8500, stock: 136, lowStockAt: 20, rating: 4.4, reviews: 121, sold: 1086,
    tags: ["cleaninghygiene", "first-aid"],
    description: "Chemical Spill Kit 28L (Bag), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-231", sku: "KS-CLN-8004", name: "Heavy Duty Chemical Resistant Rubber Gloves 22″", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 850, stock: 168, lowStockAt: 20, rating: 4.8, reviews: 133, sold: 238,
    tags: ["cleaninghygiene", "gloves"],
    description: "Heavy Duty Chemical Resistant Rubber Gloves 22″, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-232", sku: "KS-CLN-8005", name: "Heavy Duty Chemical Resistant Gloves", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 750, stock: 91, lowStockAt: 20, rating: 4.3, reviews: 16, sold: 821,
    tags: ["cleaninghygiene", "gloves"],
    description: "Heavy Duty Chemical Resistant Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-249", sku: "KS-CLN-8006", name: "PVC Dotted Cotton Gloves", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 480, stock: 123, lowStockAt: 20, rating: 4.7, reviews: 108, sold: 633,
    tags: ["cleaninghygiene", "gloves"],
    description: "PVC Dotted Cotton Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-274", sku: "KS-CLN-8007", name: "Air Fresheners", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 850, stock: 118, lowStockAt: 20, rating: 4.6, reviews: 163, sold: 408,
    tags: ["cleaninghygiene"],
    description: "Air Fresheners, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-276", sku: "KS-CLN-8008", name: "Anti-Fatigue Floor Mats", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 3200, stock: 114, lowStockAt: 20, rating: 4.6, reviews: 19, sold: 624,
    tags: ["cleaninghygiene"],
    description: "Anti-Fatigue Floor Mats, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-277", sku: "KS-CLN-8009", name: "Barber Spirit Spray Bottles", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 850, stock: 194, lowStockAt: 20, rating: 4.2, reviews: 119, sold: 704,
    tags: ["cleaninghygiene"],
    description: "Barber Spirit Spray Bottles, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-304", sku: "KS-CLN-8010", name: "Industrial Hand Dryer (1800–2200W)", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 16500, stock: 145, lowStockAt: 20, rating: 4.9, reviews: 30, sold: 435,
    tags: ["cleaninghygiene"],
    description: "Industrial Hand Dryer (1800–2200W), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-307", sku: "KS-CLN-8011", name: "Makuti Brooms (Large)", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 1200, stock: 196, lowStockAt: 20, rating: 4.4, reviews: 161, sold: 706,
    tags: ["cleaninghygiene", "cleaning"],
    description: "Makuti Brooms (Large), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-311", sku: "KS-CLN-8012", name: "Neck Barber Rolls", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 900, stock: 54, lowStockAt: 20, rating: 4.6, reviews: 99, sold: 1004,
    tags: ["cleaninghygiene"],
    description: "Neck Barber Rolls, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-329", sku: "KS-CLN-8013", name: "Stainless Steel Tissue Holders", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 850, stock: 196, lowStockAt: 20, rating: 4.8, reviews: 101, sold: 926,
    tags: ["cleaninghygiene"],
    description: "Stainless Steel Tissue Holders, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-335", sku: "KS-CLN-8014", name: "Urinal Screen Mats", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 3200, stock: 149, lowStockAt: 20, rating: 4.5, reviews: 74, sold: 659,
    tags: ["cleaninghygiene"],
    description: "Urinal Screen Mats, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-336", sku: "KS-CLN-8015", name: "Urinal Toilet Balls", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 850, stock: 151, lowStockAt: 20, rating: 4.7, reviews: 156, sold: 441,
    tags: ["cleaninghygiene"],
    description: "Urinal Toilet Balls, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-337", sku: "KS-CLN-8016", name: "Washing & Scrubbing Pads", brand: "KimSafety", category: "cleaning-hygiene", categoryName: "Cleaning & Hygiene",
    price: 850, stock: 169, lowStockAt: 20, rating: 4.9, reviews: 94, sold: 679,
    tags: ["cleaninghygiene"],
    description: "Washing & Scrubbing Pads, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-209", sku: "KS-CON-6004", name: "American Polycarbonate Industrial Safety Glass", brand: "American", category: "construction-safety", categoryName: "Construction Safety",
    price: 3800, stock: 183, lowStockAt: 20, rating: 4.7, reviews: 68, sold: 913,
    tags: ["constructionsafety"],
    description: "American Polycarbonate Industrial Safety Glass, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-229", sku: "KS-CON-6005", name: "Full Body Harness Double Hook with Shock Absorber", brand: "KimSafety", category: "construction-safety", categoryName: "Construction Safety",
    price: 6200, stock: 166, lowStockAt: 20, rating: 4.2, reviews: 111, sold: 236,
    tags: ["constructionsafety", "harness"],
    description: "Full Body Harness Double Hook with Shock Absorber, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-237", sku: "KS-ELC-1403", name: "Jua Kali Booster Cable 2000 Amp", brand: "Jua Kali", category: "electrical-safety", categoryName: "Electrical Safety",
    price: 2500, stock: 253, lowStockAt: 20, rating: 4.9, reviews: 158, sold: 983,
    tags: ["electricalsafety", "electrical"],
    description: "Jua Kali Booster Cable 2000 Amp, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-224", sku: "KS-EMR-9004", name: "First Aid Kit Stock, Refill & Restocking Supplies", brand: "KimSafety", category: "emergency-response", categoryName: "Emergency Response",
    price: 4500, stock: 253, lowStockAt: 20, rating: 4.9, reviews: 158, sold: 543,
    tags: ["emergencyresponse", "first-aid"],
    description: "First Aid Kit Stock, Refill & Restocking Supplies, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-244", sku: "KS-EMR-9005", name: "First Aid Kit (Medium, Grey)", brand: "KimSafety", category: "emergency-response", categoryName: "Emergency Response",
    price: 2800, stock: 88, lowStockAt: 20, rating: 4.4, reviews: 113, sold: 1038,
    tags: ["emergencyresponse", "first-aid"],
    description: "First Aid Kit (Medium, Grey), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-260", sku: "KS-EMR-9006", name: "Spine Board Stretcher", brand: "KimSafety", category: "emergency-response", categoryName: "Emergency Response",
    price: 12500, stock: 162, lowStockAt: 20, rating: 4.6, reviews: 27, sold: 232,
    tags: ["emergencyresponse", "stretcher"],
    description: "Spine Board Stretcher, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-201", sku: "KS-FIR-4004", name: "CO2 Fire Extinguisher 2kg", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 12500, stock: 180, lowStockAt: 20, rating: 4.8, reviews: 125, sold: 1130,
    tags: ["firesafety", "fire", "extinguisher"],
    description: "CO2 Fire Extinguisher 2kg, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-204", sku: "KS-FIR-4005", name: "ABC Dry Powder Fire Extinguisher 4kg", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 8200, stock: 94, lowStockAt: 20, rating: 4.6, reviews: 19, sold: 1044,
    tags: ["firesafety", "fire", "extinguisher"],
    description: "ABC Dry Powder Fire Extinguisher 4kg, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-205", sku: "KS-FIR-4006", name: "CO2 Fire Extinguisher 5kg", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 16500, stock: 203, lowStockAt: 20, rating: 4.3, reviews: 128, sold: 713,
    tags: ["firesafety", "fire", "extinguisher"],
    description: "CO2 Fire Extinguisher 5kg, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-206", sku: "KS-FIR-4007", name: "ABC Dry Powder Fire Extinguisher 9kg", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 12500, stock: 59, lowStockAt: 20, rating: 4.3, reviews: 24, sold: 349,
    tags: ["firesafety", "fire", "extinguisher"],
    description: "ABC Dry Powder Fire Extinguisher 9kg, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-214", sku: "KS-FIR-4008", name: "Fire Marshal Reflective Vest (Branded)", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 1500, stock: 105, lowStockAt: 20, rating: 4.5, reviews: 170, sold: 175,
    tags: ["firesafety", "fire", "vest"],
    description: "Fire Marshal Reflective Vest (Branded), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-222", sku: "KS-FIR-4009", name: "Fire Hose Pipe", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 5500, stock: 56, lowStockAt: 20, rating: 4.8, reviews: 61, sold: 1006,
    tags: ["firesafety", "fire"],
    description: "Fire Hose Pipe, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-230", sku: "KS-FIR-4010", name: "Heat Detector", brand: "KimSafety", category: "fire-safety", categoryName: "Fire Safety",
    price: 2600, stock: 77, lowStockAt: 20, rating: 4.9, reviews: 62, sold: 1027,
    tags: ["firesafety", "detector"],
    description: "Heat Detector, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-226", sku: "KS-FOO-1203", name: "Disposable Hairnets (Food & Medical Grade)", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 600, stock: 82, lowStockAt: 20, rating: 4.6, reviews: 147, sold: 1032,
    tags: ["foodsafety"],
    description: "Disposable Hairnets (Food & Medical Grade), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-279", sku: "KS-FOO-1204", name: "Beard Covers", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 700, stock: 113, lowStockAt: 20, rating: 4.5, reviews: 98, sold: 403,
    tags: ["foodsafety", "hearing"],
    description: "Beard Covers, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-291", sku: "KS-FOO-1205", name: "Disposable Chef Caps", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 550, stock: 256, lowStockAt: 20, rating: 4.8, reviews: 141, sold: 986,
    tags: ["foodsafety"],
    description: "Disposable Chef Caps, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-296", sku: "KS-FOO-1206", name: "Food Industry Dustcoats", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 2600, stock: 233, lowStockAt: 20, rating: 4.5, reviews: 138, sold: 303,
    tags: ["foodsafety", "coveralls"],
    description: "Food Industry Dustcoats, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-297", sku: "KS-FOO-1207", name: "Food-Grade Biodegradable Garbage Bags", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 1500, stock: 56, lowStockAt: 20, rating: 4.4, reviews: 121, sold: 346,
    tags: ["foodsafety"],
    description: "Food-Grade Biodegradable Garbage Bags, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-298", sku: "KS-FOO-1208", name: "Food-Grade Mops & Brushes", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 1200, stock: 62, lowStockAt: 20, rating: 4.6, reviews: 107, sold: 792,
    tags: ["foodsafety", "cleaning"],
    description: "Food-Grade Mops & Brushes, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-301", sku: "KS-FOO-1209", name: "Hair Nets (Bouffant)", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 450, stock: 147, lowStockAt: 20, rating: 4.7, reviews: 132, sold: 217,
    tags: ["foodsafety"],
    description: "Hair Nets (Bouffant), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-322", sku: "KS-FOO-1210", name: "Reusable Chef Hats", brand: "KimSafety", category: "food-safety", categoryName: "Food Safety",
    price: 550, stock: 154, lowStockAt: 20, rating: 4.6, reviews: 139, sold: 1104,
    tags: ["foodsafety"],
    description: "Reusable Chef Hats, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-228", sku: "KS-IND-2008", name: "General Purpose Industrial Gumboot (Green)", brand: "KimSafety", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1900, stock: 121, lowStockAt: 20, rating: 4.9, reviews: 86, sold: 411,
    tags: ["industrialsafety", "boots"],
    description: "General Purpose Industrial Gumboot (Green), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-235", sku: "KS-IND-2009", name: "HIVIEW Safety Boot HTS4101", brand: "HIVIEW", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 5200, stock: 200, lowStockAt: 20, rating: 4.8, reviews: 125, sold: 270,
    tags: ["industrialsafety", "boots"],
    description: "HIVIEW Safety Boot HTS4101, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-255", sku: "KS-IND-2010", name: "Safety Jogger Best Boy Safety Boot", brand: "Safety Jogger", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 5600, stock: 55, lowStockAt: 20, rating: 4.3, reviews: 120, sold: 565,
    tags: ["industrialsafety", "boots"],
    description: "Safety Jogger Best Boy Safety Boot, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-256", sku: "KS-IND-2011", name: "Safety Jogger Safety Manager Boot", brand: "Safety Jogger", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 6100, stock: 206, lowStockAt: 20, rating: 4.6, reviews: 91, sold: 1156,
    tags: ["industrialsafety", "boots"],
    description: "Safety Jogger Safety Manager Boot, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-258", sku: "KS-IND-2012", name: "Sandak Gumboot", brand: "Sandak", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 2200, stock: 176, lowStockAt: 20, rating: 4.4, reviews: 41, sold: 466,
    tags: ["industrialsafety", "boots"],
    description: "Sandak Gumboot, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-262", sku: "KS-IND-2013", name: "Steel Toe Gumboot", brand: "KimSafety", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 2400, stock: 171, lowStockAt: 20, rating: 4.3, reviews: 16, sold: 241,
    tags: ["industrialsafety", "boots"],
    description: "Steel Toe Gumboot, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-268", sku: "KS-IND-2014", name: "Vaultex Safety Boot", brand: "Vaultex", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 5000, stock: 64, lowStockAt: 20, rating: 4.8, reviews: 109, sold: 574,
    tags: ["industrialsafety", "boots"],
    description: "Vaultex Safety Boot, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-269", sku: "KS-IND-2015", name: "Vaultex Safety Helmet", brand: "Vaultex", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1600, stock: 245, lowStockAt: 20, rating: 4.9, reviews: 150, sold: 1195,
    tags: ["industrialsafety", "helmet"],
    description: "Vaultex Safety Helmet, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-272", sku: "KS-IND-2016", name: "Yamato Japanese Safety Shoe", brand: "Yamato", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 4800, stock: 266, lowStockAt: 20, rating: 4.6, reviews: 131, sold: 776,
    tags: ["industrialsafety", "boots"],
    description: "Yamato Japanese Safety Shoe, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-286", sku: "KS-IND-2017", name: "Construction Helmets", brand: "KimSafety", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 1500, stock: 112, lowStockAt: 20, rating: 4.8, reviews: 77, sold: 842,
    tags: ["industrialsafety", "helmet"],
    description: "Construction Helmets, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-330", sku: "KS-IND-2018", name: "Steel-Toe Safety Shoes", brand: "KimSafety", category: "industrial-safety", categoryName: "Industrial Safety",
    price: 4600, stock: 257, lowStockAt: 20, rating: 4.9, reviews: 22, sold: 987,
    tags: ["industrialsafety", "boots"],
    description: "Steel-Toe Safety Shoes, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-202", sku: "KS-MED-1006", name: "3-Ply Washable & Reusable Face Mask (KEBS Approved)", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 350, stock: 150, lowStockAt: 20, rating: 4.6, reviews: 75, sold: 660,
    tags: ["medicalsafety", "masks"],
    description: "3-Ply Washable & Reusable Face Mask (KEBS Approved), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-213", sku: "KS-MED-1007", name: "Medic Face Shield (Blue)", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 950, stock: 54, lowStockAt: 20, rating: 4.6, reviews: 19, sold: 564,
    tags: ["medicalsafety"],
    description: "Medic Face Shield (Blue), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-225", sku: "KS-MED-1008", name: "Foldable Wheelchair", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 18500, stock: 190, lowStockAt: 20, rating: 4.2, reviews: 135, sold: 700,
    tags: ["medicalsafety", "wheelchair"],
    description: "Foldable Wheelchair, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-239", sku: "KS-MED-1009", name: "Latex Powdered Medical Examination Gloves", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 1600, stock: 95, lowStockAt: 20, rating: 4.7, reviews: 100, sold: 1045,
    tags: ["medicalsafety", "gloves"],
    description: "Latex Powdered Medical Examination Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-248", sku: "KS-MED-1010", name: "Professional Stethoscope", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 3800, stock: 189, lowStockAt: 20, rating: 4.5, reviews: 154, sold: 699,
    tags: ["medicalsafety"],
    description: "Professional Stethoscope, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-261", sku: "KS-MED-1011", name: "Standard Foldable Wheelchair", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 16500, stock: 117, lowStockAt: 20, rating: 4.5, reviews: 162, sold: 1067,
    tags: ["medicalsafety", "wheelchair"],
    description: "Standard Foldable Wheelchair, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-310", sku: "KS-MED-1012", name: "Metal Detectable Bandages", brand: "KimSafety", category: "medical-safety", categoryName: "Medical Safety",
    price: 650, stock: 246, lowStockAt: 20, rating: 4.6, reviews: 131, sold: 1196,
    tags: ["medicalsafety"],
    description: "Metal Detectable Bandages, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-203", sku: "KS-PPE-3005", name: "4-Stripe Orange Reflective Vest", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 128, lowStockAt: 20, rating: 4.8, reviews: 133, sold: 858,
    tags: ["ppe", "vest"],
    description: "4-Stripe Orange Reflective Vest, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-215", sku: "KS-PPE-3006", name: "HiVis Bump Cap (Black/Orange)", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1100, stock: 121, lowStockAt: 20, rating: 4.5, reviews: 66, sold: 411,
    tags: ["ppe"],
    description: "HiVis Bump Cap (Black/Orange), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-217", sku: "KS-PPE-3007", name: "Construction Rigger Leather Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1400, stock: 127, lowStockAt: 20, rating: 4.7, reviews: 52, sold: 637,
    tags: ["ppe", "gloves"],
    description: "Construction Rigger Leather Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-218", sku: "KS-PPE-3008", name: "Designer Reflective Jacket (Orange)", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 3200, stock: 200, lowStockAt: 20, rating: 4.8, reviews: 125, sold: 270,
    tags: ["ppe", "signage", "jacket"],
    description: "Designer Reflective Jacket (Orange), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-219", sku: "KS-PPE-3009", name: "Designer Reflective Vest (Orange/Black)", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1300, stock: 226, lowStockAt: 20, rating: 4.6, reviews: 171, sold: 736,
    tags: ["ppe", "signage", "vest"],
    description: "Designer Reflective Vest (Orange/Black), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-233", sku: "KS-PPE-3010", name: "Heavy Duty Industrial Dungaree", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 3200, stock: 206, lowStockAt: 20, rating: 4.2, reviews: 71, sold: 716,
    tags: ["ppe"],
    description: "Heavy Duty Industrial Dungaree, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-234", sku: "KS-PPE-3011", name: "High-Quality Reflective Windbreaker", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2400, stock: 258, lowStockAt: 20, rating: 4.6, reviews: 43, sold: 328,
    tags: ["ppe"],
    description: "High-Quality Reflective Windbreaker, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-241", sku: "KS-PPE-3012", name: "Light Reflective Riders Jacket", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2800, stock: 205, lowStockAt: 20, rating: 4.9, reviews: 110, sold: 715,
    tags: ["ppe", "jacket"],
    description: "Light Reflective Riders Jacket, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-250", sku: "KS-PPE-3013", name: "Rain Coat with Inner Lining", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2800, stock: 197, lowStockAt: 20, rating: 4.9, reviews: 22, sold: 1147,
    tags: ["ppe"],
    description: "Rain Coat with Inner Lining, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-251", sku: "KS-PPE-3014", name: "Rain Coat", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2400, stock: 130, lowStockAt: 20, rating: 4.6, reviews: 75, sold: 640,
    tags: ["ppe"],
    description: "Rain Coat, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-252", sku: "KS-PPE-3015", name: "Knicker Cut-Resistant Gloves", brand: "Resends", category: "ppe", categoryName: "PPE",
    price: 1600, stock: 82, lowStockAt: 20, rating: 4.6, reviews: 27, sold: 372,
    tags: ["ppe", "gloves"],
    description: "Knicker Cut-Resistant Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-253", sku: "KS-PPE-3016", name: "Riders Chest Guard", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2500, stock: 124, lowStockAt: 20, rating: 4.8, reviews: 149, sold: 1074,
    tags: ["ppe"],
    description: "Riders Chest Guard, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-254", sku: "KS-PPE-3017", name: "Classic Safety Goggles", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 850, stock: 151, lowStockAt: 20, rating: 4.3, reviews: 136, sold: 881,
    tags: ["ppe", "goggles"],
    description: "Classic Safety Goggles, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-257", sku: "KS-PPE-3018", name: "Safety Overalls", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2900, stock: 89, lowStockAt: 20, rating: 4.5, reviews: 34, sold: 1039,
    tags: ["ppe", "coveralls"],
    description: "Safety Overalls, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-266", sku: "KS-PPE-3019", name: "Ultimate Plus Cut-Resistant Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1900, stock: 160, lowStockAt: 20, rating: 4.8, reviews: 85, sold: 890,
    tags: ["ppe", "gloves"],
    description: "Ultimate Plus Cut-Resistant Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-267", sku: "KS-PPE-3020", name: "Vaultex Dust Mask VB1", brand: "Vaultex", category: "ppe", categoryName: "PPE",
    price: 700, stock: 269, lowStockAt: 20, rating: 4.5, reviews: 114, sold: 779,
    tags: ["ppe", "masks"],
    description: "Vaultex Dust Mask VB1, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-270", sku: "KS-PPE-3021", name: "Welding Goggles", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 950, stock: 199, lowStockAt: 20, rating: 4.3, reviews: 104, sold: 489,
    tags: ["ppe", "goggles"],
    description: "Welding Goggles, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-275", sku: "KS-PPE-3022", name: "Anti-Cut Gloves (TraffiGlove)", brand: "Traffiglove", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 104, lowStockAt: 20, rating: 4.8, reviews: 149, sold: 834,
    tags: ["ppe", "gloves"],
    description: "Anti-Cut Gloves (TraffiGlove), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-278", sku: "KS-PPE-3023", name: "Barber Wrap Capes", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1500, stock: 213, lowStockAt: 20, rating: 4.9, reviews: 118, sold: 943,
    tags: ["ppe"],
    description: "Barber Wrap Capes, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-280", sku: "KS-PPE-3024", name: "Black Multi-Use Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 95, lowStockAt: 20, rating: 4.3, reviews: 160, sold: 605,
    tags: ["ppe", "gloves"],
    description: "Black Multi-Use Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-281", sku: "KS-PPE-3025", name: "Blue Reusable Nitrile Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 213, lowStockAt: 20, rating: 4.9, reviews: 118, sold: 1163,
    tags: ["ppe", "gloves", "nitrile"],
    description: "Blue Reusable Nitrile Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-287", sku: "KS-PPE-3026", name: "Cotton Aprons", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1500, stock: 73, lowStockAt: 20, rating: 4.9, reviews: 78, sold: 143,
    tags: ["ppe", "aprons"],
    description: "Cotton Aprons, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-289", sku: "KS-PPE-3027", name: "Cowhide TIG Leather Gloves 14″", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 263, lowStockAt: 20, rating: 4.3, reviews: 88, sold: 1213,
    tags: ["ppe", "gloves"],
    description: "Cowhide TIG Leather Gloves 14″, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-292", sku: "KS-PPE-3028", name: "Double Respirator Mask (NP306)", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 800, stock: 77, lowStockAt: 20, rating: 4.9, reviews: 62, sold: 807,
    tags: ["ppe", "masks", "respirator"],
    description: "Double Respirator Mask (NP306), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-293", sku: "KS-PPE-3029", name: "Ear Plugs", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2400, stock: 142, lowStockAt: 20, rating: 4.6, reviews: 27, sold: 652,
    tags: ["ppe", "hearing"],
    description: "Ear Plugs, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-300", sku: "KS-PPE-3030", name: "Green Nitrile Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 261, lowStockAt: 20, rating: 4.5, reviews: 26, sold: 551,
    tags: ["ppe", "gloves", "nitrile"],
    description: "Green Nitrile Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-303", sku: "KS-PPE-3031", name: "Heavy-Duty Twill Overalls", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2600, stock: 97, lowStockAt: 20, rating: 4.5, reviews: 82, sold: 607,
    tags: ["ppe", "coveralls"],
    description: "Heavy-Duty Twill Overalls, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-305", sku: "KS-PPE-3032", name: "Leather Garden Gloves 10″", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 75, lowStockAt: 20, rating: 4.7, reviews: 20, sold: 1025,
    tags: ["ppe", "gloves"],
    description: "Leather Garden Gloves 10″, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-306", sku: "KS-PPE-3033", name: "Leather Working Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 171, lowStockAt: 20, rating: 4.3, reviews: 136, sold: 461,
    tags: ["ppe", "gloves"],
    description: "Leather Working Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-320", sku: "KS-PPE-3034", name: "Red Heavy-Duty Nitrile Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 173, lowStockAt: 20, rating: 4.9, reviews: 78, sold: 903,
    tags: ["ppe", "gloves", "nitrile"],
    description: "Red Heavy-Duty Nitrile Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-321", sku: "KS-PPE-3035", name: "Reflective Overalls (Normal Duty)", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2600, stock: 116, lowStockAt: 20, rating: 4.4, reviews: 41, sold: 626,
    tags: ["ppe", "coveralls"],
    description: "Reflective Overalls (Normal Duty), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-324", sku: "KS-PPE-3036", name: "Safety Balaclava", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 700, stock: 222, lowStockAt: 20, rating: 4.2, reviews: 87, sold: 512,
    tags: ["ppe"],
    description: "Safety Balaclava, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-325", sku: "KS-PPE-3037", name: "Salon Wrap Aprons", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1500, stock: 235, lowStockAt: 20, rating: 4.7, reviews: 140, sold: 305,
    tags: ["ppe", "aprons"],
    description: "Salon Wrap Aprons, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-326", sku: "KS-PPE-3038", name: "Shoe Covers", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 700, stock: 124, lowStockAt: 20, rating: 4.4, reviews: 89, sold: 414,
    tags: ["ppe", "boots"],
    description: "Shoe Covers, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-327", sku: "KS-PPE-3039", name: "Single Respirator Mask (NP307)", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 800, stock: 65, lowStockAt: 20, rating: 4.5, reviews: 170, sold: 575,
    tags: ["ppe", "masks", "respirator"],
    description: "Single Respirator Mask (NP307), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-338", sku: "KS-PPE-3040", name: "Waterproof Canvas Aprons", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1500, stock: 93, lowStockAt: 20, rating: 4.5, reviews: 98, sold: 1043,
    tags: ["ppe", "aprons"],
    description: "Waterproof Canvas Aprons, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-339", sku: "KS-PPE-3041", name: "Welding Gloves", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 1200, stock: 101, lowStockAt: 20, rating: 4.5, reviews: 106, sold: 831,
    tags: ["ppe", "gloves"],
    description: "Welding Gloves, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-340", sku: "KS-PPE-3042", name: "Workwear Dustcoats", brand: "KimSafety", category: "ppe", categoryName: "PPE",
    price: 2600, stock: 225, lowStockAt: 20, rating: 4.9, reviews: 150, sold: 295,
    tags: ["ppe", "hearing", "coveralls"],
    description: "Workwear Dustcoats, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-211", sku: "KS-ROA-5005", name: "Barricade Caution Tape (Yellow/Black, 2″)", brand: "KimSafety", category: "road-safety", categoryName: "Road Safety",
    price: 750, stock: 265, lowStockAt: 20, rating: 4.5, reviews: 130, sold: 555,
    tags: ["roadsafety", "tape"],
    description: "Barricade Caution Tape (Yellow/Black, 2″), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-212", sku: "KS-ROA-5006", name: "Barrier & Safety Barricade Tape", brand: "KimSafety", category: "road-safety", categoryName: "Road Safety",
    price: 650, stock: 245, lowStockAt: 20, rating: 4.5, reviews: 50, sold: 535,
    tags: ["roadsafety", "tape"],
    description: "Barrier & Safety Barricade Tape, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-265", sku: "KS-ROA-5007", name: "Truck Traffic Reflective Warning Safety Tape", brand: "KimSafety", category: "road-safety", categoryName: "Road Safety",
    price: 900, stock: 96, lowStockAt: 20, rating: 4.4, reviews: 161, sold: 606,
    tags: ["roadsafety", "tape"],
    description: "Truck Traffic Reflective Warning Safety Tape, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-283", sku: "KS-ROA-5008", name: "Caution Barrier Tape", brand: "KimSafety", category: "road-safety", categoryName: "Road Safety",
    price: 1200, stock: 177, lowStockAt: 20, rating: 4.9, reviews: 22, sold: 467,
    tags: ["roadsafety", "tape"],
    description: "Caution Barrier Tape, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-210", sku: "KS-SEC-1102", name: "Askari Security Baton", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 1800, stock: 204, lowStockAt: 20, rating: 4.8, reviews: 29, sold: 494,
    tags: ["securityequipment"],
    description: "Askari Security Baton, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-220", sku: "KS-SEC-1103", name: "Electric Fence System", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 28000, stock: 148, lowStockAt: 20, rating: 4.4, reviews: 73, sold: 878,
    tags: ["securityequipment", "fencing"],
    description: "Electric Fence System, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-227", sku: "KS-SEC-1104", name: "Garrett Metal Detector", brand: "Garrett", category: "security-equipment", categoryName: "Security Equipment",
    price: 38500, stock: 113, lowStockAt: 20, rating: 4.5, reviews: 138, sold: 183,
    tags: ["securityequipment", "detector"],
    description: "Garrett Metal Detector, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-246", sku: "KS-SEC-1105", name: "Power Megaphone", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 4200, stock: 168, lowStockAt: 20, rating: 4.4, reviews: 73, sold: 458,
    tags: ["securityequipment"],
    description: "Power Megaphone, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-259", sku: "KS-SEC-1106", name: "Security Whistle", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 350, stock: 239, lowStockAt: 20, rating: 4.3, reviews: 104, sold: 529,
    tags: ["securityequipment", "security"],
    description: "Security Whistle, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-263", sku: "KS-SEC-1107", name: "Stun Gun Self-Defense Flashlight Torch 288", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 4800, stock: 56, lowStockAt: 20, rating: 4.4, reviews: 121, sold: 786,
    tags: ["securityequipment"],
    description: "Stun Gun Self-Defense Flashlight Torch 288, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-264", sku: "KS-SEC-1108", name: "Suggestion Box (Mid Size)", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 2600, stock: 72, lowStockAt: 20, rating: 4.4, reviews: 97, sold: 1022,
    tags: ["securityequipment"],
    description: "Suggestion Box (Mid Size), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-271", sku: "KS-SEC-1109", name: "Wooden Suggestion Box", brand: "KimSafety", category: "security-equipment", categoryName: "Security Equipment",
    price: 3200, stock: 224, lowStockAt: 20, rating: 4.4, reviews: 129, sold: 294,
    tags: ["securityequipment"],
    description: "Wooden Suggestion Box, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-207", sku: "KS-SIG-1303", name: "Construction In Progress Sign (A2)", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1450, stock: 151, lowStockAt: 20, rating: 4.7, reviews: 156, sold: 661,
    tags: ["signslabels", "signage"],
    description: "Construction In Progress Sign (A2), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-208", sku: "KS-SIG-1304", name: "Deep Excavation Warning Sign (A2)", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1450, stock: 246, lowStockAt: 20, rating: 4.6, reviews: 91, sold: 536,
    tags: ["signslabels", "signage"],
    description: "Deep Excavation Warning Sign (A2), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-221", sku: "KS-SIG-1305", name: "Fire Action Plan Sign", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1200, stock: 247, lowStockAt: 20, rating: 4.7, reviews: 92, sold: 977,
    tags: ["signslabels", "fire", "signage"],
    description: "Fire Action Plan Sign, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-223", sku: "KS-SIG-1306", name: "Fire Point Sign", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1200, stock: 234, lowStockAt: 20, rating: 4.2, reviews: 159, sold: 744,
    tags: ["signslabels", "fire", "signage"],
    description: "Fire Point Sign, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-242", sku: "KS-SIG-1307", name: "Lock Out / Tag Out Sign", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1100, stock: 184, lowStockAt: 20, rating: 4.4, reviews: 169, sold: 254,
    tags: ["signslabels", "signage"],
    description: "Lock Out / Tag Out Sign, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-243", sku: "KS-SIG-1308", name: "LPG Safety Signage", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1100, stock: 62, lowStockAt: 20, rating: 4.2, reviews: 167, sold: 792,
    tags: ["signslabels", "signage"],
    description: "LPG Safety Signage, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-245", sku: "KS-SIG-1309", name: "Men At Work Sign", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1300, stock: 246, lowStockAt: 20, rating: 4.2, reviews: 31, sold: 756,
    tags: ["signslabels", "signage"],
    description: "Men At Work Sign, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-247", sku: "KS-SIG-1310", name: "PPE Required Signage", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1200, stock: 225, lowStockAt: 20, rating: 4.5, reviews: 50, sold: 735,
    tags: ["signslabels", "signage"],
    description: "PPE Required Signage, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-294", sku: "KS-SIG-1311", name: "Floor Marking Tape", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1200, stock: 266, lowStockAt: 20, rating: 4.2, reviews: 151, sold: 556,
    tags: ["signslabels", "tape"],
    description: "Floor Marking Tape, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-295", sku: "KS-SIG-1312", name: "Floor Safety Signages", brand: "KimSafety", category: "signs-labels", categoryName: "Signs & Labels",
    price: 1200, stock: 254, lowStockAt: 20, rating: 4.6, reviews: 139, sold: 1204,
    tags: ["signslabels", "signage"],
    description: "Floor Safety Signages, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-200", sku: "KS-TOOL-1502", name: "12-Step Multipurpose Aluminium Ladder 3.7m (Red Edition)", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 16500, stock: 248, lowStockAt: 20, rating: 4.8, reviews: 173, sold: 1198,
    tags: ["tools", "ladder"],
    description: "12-Step Multipurpose Aluminium Ladder 3.7m (Red Edition), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-236", sku: "KS-TOOL-1503", name: "Iron Multifolding Extension Ladder", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 12500, stock: 184, lowStockAt: 20, rating: 4.8, reviews: 69, sold: 914,
    tags: ["tools", "ladder"],
    description: "Iron Multifolding Extension Ladder, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-238", sku: "KS-TOOL-1504", name: "Folding Aluminium Ladder", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 9500, stock: 77, lowStockAt: 20, rating: 4.9, reviews: 62, sold: 147,
    tags: ["tools", "ladder"],
    description: "Folding Aluminium Ladder, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-240", sku: "KS-TOOL-1505", name: "LED Strong Light Flashlight", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 2200, stock: 247, lowStockAt: 20, rating: 4.7, reviews: 172, sold: 317,
    tags: ["tools"],
    description: "LED Strong Light Flashlight, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-273", sku: "KS-TOOL-1506", name: "A4 Label Papers", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 900, stock: 147, lowStockAt: 20, rating: 4.3, reviews: 72, sold: 217,
    tags: ["tools"],
    description: "A4 Label Papers, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-282", sku: "KS-TOOL-1507", name: "Bubble Wrap (100m Roll)", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 900, stock: 153, lowStockAt: 20, rating: 4.9, reviews: 118, sold: 883,
    tags: ["tools"],
    description: "Bubble Wrap (100m Roll), quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-284", sku: "KS-TOOL-1508", name: "Cellotape", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 380, stock: 194, lowStockAt: 20, rating: 4.2, reviews: 39, sold: 264,
    tags: ["tools", "tape"],
    description: "Cellotape, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-285", sku: "KS-TOOL-1509", name: "Cellotape Dispenser", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 380, stock: 93, lowStockAt: 20, rating: 4.5, reviews: 18, sold: 603,
    tags: ["tools", "tape"],
    description: "Cellotape Dispenser, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-288", sku: "KS-TOOL-1510", name: "Cotton Sewing Yarn", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1200, stock: 177, lowStockAt: 20, rating: 4.9, reviews: 22, sold: 247,
    tags: ["tools"],
    description: "Cotton Sewing Yarn, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-290", sku: "KS-TOOL-1511", name: "Digital Wall Clock", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 4500, stock: 163, lowStockAt: 20, rating: 4.3, reviews: 168, sold: 1113,
    tags: ["tools"],
    description: "Digital Wall Clock, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-299", sku: "KS-TOOL-1512", name: "Grease-Proof Packaging Paper", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 900, stock: 160, lowStockAt: 20, rating: 4.4, reviews: 105, sold: 450,
    tags: ["tools", "packaging"],
    description: "Grease-Proof Packaging Paper, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-302", sku: "KS-TOOL-1513", name: "Handheld Inkjet Coding Printer", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 55000, stock: 98, lowStockAt: 20, rating: 4.6, reviews: 83, sold: 1048,
    tags: ["tools"],
    description: "Handheld Inkjet Coding Printer, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-308", sku: "KS-TOOL-1514", name: "Manilla Baler Twine", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1500, stock: 156, lowStockAt: 20, rating: 4.8, reviews: 141, sold: 226,
    tags: ["tools"],
    description: "Manilla Baler Twine, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-309", sku: "KS-TOOL-1515", name: "Manual Strapping Tool", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 12500, stock: 207, lowStockAt: 20, rating: 4.3, reviews: 72, sold: 277,
    tags: ["tools"],
    description: "Manual Strapping Tool, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-312", sku: "KS-TOOL-1516", name: "Non-Woven Packaging Bags", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1500, stock: 62, lowStockAt: 20, rating: 4.2, reviews: 87, sold: 572,
    tags: ["tools", "packaging"],
    description: "Non-Woven Packaging Bags, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-313", sku: "KS-TOOL-1517", name: "Pallet Stretch Film", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1500, stock: 230, lowStockAt: 20, rating: 4.2, reviews: 135, sold: 960,
    tags: ["tools"],
    description: "Pallet Stretch Film, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-314", sku: "KS-TOOL-1518", name: "PH2 Magnetic Drill Bits 65mm", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1900, stock: 165, lowStockAt: 20, rating: 4.5, reviews: 170, sold: 455,
    tags: ["tools"],
    description: "PH2 Magnetic Drill Bits 65mm, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-315", sku: "KS-TOOL-1519", name: "Pop Rivet Machine", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1900, stock: 249, lowStockAt: 20, rating: 4.9, reviews: 174, sold: 759,
    tags: ["tools"],
    description: "Pop Rivet Machine, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-316", sku: "KS-TOOL-1520", name: "Pop Rivets", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1900, stock: 169, lowStockAt: 20, rating: 4.5, reviews: 74, sold: 1119,
    tags: ["tools"],
    description: "Pop Rivets, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-317", sku: "KS-TOOL-1521", name: "Portable Bag Closer Machine", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 12500, stock: 163, lowStockAt: 20, rating: 4.3, reviews: 88, sold: 1113,
    tags: ["tools"],
    description: "Portable Bag Closer Machine, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-318", sku: "KS-TOOL-1522", name: "PP Strapping Rolls 15mm", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 900, stock: 239, lowStockAt: 20, rating: 4.7, reviews: 164, sold: 969,
    tags: ["tools"],
    description: "PP Strapping Rolls 15mm, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-319", sku: "KS-TOOL-1523", name: "PP Woven Sacks", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1500, stock: 181, lowStockAt: 20, rating: 4.5, reviews: 26, sold: 471,
    tags: ["tools"],
    description: "PP Woven Sacks, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-323", sku: "KS-TOOL-1524", name: "Rubber Bands", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1200, stock: 239, lowStockAt: 20, rating: 4.7, reviews: 164, sold: 1189,
    tags: ["tools"],
    description: "Rubber Bands, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-328", sku: "KS-TOOL-1525", name: "Sisal Twine", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1500, stock: 216, lowStockAt: 20, rating: 4.8, reviews: 141, sold: 1166,
    tags: ["tools"],
    description: "Sisal Twine, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-331", sku: "KS-TOOL-1526", name: "Strapping Metal Clips", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 1200, stock: 237, lowStockAt: 20, rating: 4.5, reviews: 122, sold: 1187,
    tags: ["tools"],
    description: "Strapping Metal Clips, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-332", sku: "KS-TOOL-1527", name: "Thermal Receipt Rolls", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 900, stock: 260, lowStockAt: 20, rating: 4.8, reviews: 45, sold: 770,
    tags: ["tools"],
    description: "Thermal Receipt Rolls, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-333", sku: "KS-TOOL-1528", name: "Thermal Shipping Labels", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 900, stock: 167, lowStockAt: 20, rating: 4.3, reviews: 112, sold: 897,
    tags: ["tools"],
    description: "Thermal Shipping Labels, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
  p({
    id: "p-334", sku: "KS-TOOL-1529", name: "Carton Boxes", brand: "KimSafety", category: "tools", categoryName: "Tools & Hardware",
    price: 3800, stock: 167, lowStockAt: 20, rating: 4.3, reviews: 112, sold: 1117,
    tags: ["tools", "packaging"],
    description: "Carton Boxes, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.",
  }),
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getBySlug(slug: string) {
  return products.find((p) => p.slug === slug || p.sku === slug || p.id === slug);
}

export function relatedFor(product: Product, count = 8): Product[] {
  const sameCat = products.filter(
    (p) =>
      p.id !== product.id &&
      (p.category === product.category || (product.categories ?? []).includes(p.category))
  );
  const sameBrand = products.filter(
    (p) => p.brand === product.brand && p.id !== product.id && !sameCat.includes(p)
  );
  const others = products.filter(
    (p) => !sameCat.includes(p) && !sameBrand.includes(p) && p.id !== product.id
  );
  return [...sameCat, ...sameBrand, ...others].slice(0, count);
}

export function matchesQuery(p: Product, query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = [p.name, p.sku, p.brand, p.categoryName, ...p.tags].join(" ").toLowerCase();
  return tokens.every((t) => {
    if (haystack.includes(t)) return true;
    if (t.length > 3 && t.endsWith("s") && haystack.includes(t.slice(0, -1))) return true;
    if (t.length > 4 && t.endsWith("es") && haystack.includes(t.slice(0, -2))) return true;
    return t.endsWith("ies") && haystack.includes(t.slice(0, -3) + "y");
  });
}

export function searchProducts(query: string, list: Product[] = products): Product[] {
  if (!query.trim()) return [];
  return list.filter((p) => matchesQuery(p, query)).slice(0, 8);
}
