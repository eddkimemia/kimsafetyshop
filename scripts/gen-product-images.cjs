const fs = require("fs");

const PRODUCTS_FILE = "src/lib/data/products.ts";
const IMAGES_DIR = "public/images/products";
const OUT_MAPPING = "src/lib/data/product-images.ts";
const OUT_ENTRIES = "new-products.ts";

// ---------- existing products (id, sku, name) ----------
function parseExistingProducts() {
  const s = fs.readFileSync(PRODUCTS_FILE, "utf8");
  const block = s.slice(s.indexOf("export const products"), s.indexOf("export function getProduct"));
  const out = [];
  const re = /id: "(p-\d+)", sku: "(KS-[A-Z]+-\d+)", name: "([^"]+)"/g;
  let m;
  while ((m = re.exec(block))) out.push({ id: m[1], sku: m[2], name: m[3] });
  return out;
}

// ---------- text helpers ----------
function stem(t) {
  return t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t;
}
function tokens(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 2)
    .map(stem);
}
function titleCase(str) {
  return str
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (/^[a-z]/i.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
    .replace(/ -/g, " -")
    .replace(/\(/g, " (")
    .replace(/\)/g, ") ");
}
function slugify(name) {
  return name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ---------- curated list: [file, action, extra] ----------
const CURATED = [
  ["Powder Free Disposable Latex Gloves.jpg", "map", "KS-MED-1001"],
  ["GE 1548 King Safety Helmet.jpeg", "map", "KS-IND-2001"],
  ["Safety Jogger Safety Boot.png", "map", "KS-IND-2002"],
  ["JSP HALF FACE MASK RESPIRATOR MASK.jpeg", "map", "KS-PPE-3001"],
  ["Diamond Grip industrial Gloves.jpg", "map", "KS-PPE-3002"],
  ["6KG DRY POWDER FIRE EXTINGUISHER.jpg", "map", "KS-FIR-4001"],
  ["Smoke Detector.jpg", "map", "KS-FIR-4002"],
  ["2 Stripes Reflective Vest AA12.jpg", "map", "KS-ROA-5002"],
  ["Double Hook Work Man Full Body Safety Harness.jpg", "map", "KS-CON-6001"],
  ["Medium Clear First Aid Kit.jpg", "map", "KS-EMR-9001"],
  ["Personal Flotation Device.jpg", "map", "KS-MAR-1001"],
  ["CCTV Camera HD.png", "map", "KS-SEC-1101"],
  ["PROTECTA CHEMICAL SAFETY GOGGLES.jpg", "map", "KS-IND-2003"],
  ["KRICKWOOD EAR MUFFS.jpg", "map", "KS-PPE-3003"],
  ["Cargo Overalls With Reflectors.jpg", "map", "KS-IND-2004"],
  ["Safety Reflective Jacket (Long Sleeve-Yellow).png", "map", "KS-IND-2005"],
  ["Taiwan Chemical medical Clear Safety Goggles.jpg", "map", "KS-LAB-7002"],
  ["General Purpose Face Shield.jpg", "map", "KS-IND-2007"],
  ["Folding Canvas Stretcher.jpg", "map", "KS-EMR-9003"],
  ["Assorted Industrial Gloves.jpg", "map", "KS-IND-2006"],
  ["Filter Mask.jpg", "map", "KS-PPE-3004"],
  ["Red Pvc Gloves With Polyester Lining.jpg", "map", "KS-CLN-8002"],
  ["Dust Coat.png", "map", "KS-LAB-7003"],
  ["Work In Progress.jpg", "map", "KS-SIG-1302"],
  ["HIVIEW SAFETY BOOT HTSO1.jpeg", "skip"],
  ["Deep Excavation Sign.png", "skip"],
  ["Steel Toe Gumboot.jpg", "skip"],
  ["12 STEP RED EDITION MULTIPURPOSE ALUMINIUM LADDER 3.7M.jpg", "new", { name: "12-Step Multipurpose Aluminium Ladder 3.7m (Red Edition)", category: "tools", brand: "KimSafety", price: 16500 }],
  ["2Kg CO2 Fire Extinguisher.jpg", "new", { name: "CO2 Fire Extinguisher 2kg", category: "fire-safety", brand: "KimSafety", price: 12500 }],
  ["3ply Washable and Reusable Face Mask with KEBS Approval.jpg", "new", { name: "3-Ply Washable & Reusable Face Mask (KEBS Approved)", category: "medical-safety", brand: "KimSafety", price: 350 }],
  ["4 Stripped Orange Reflective Vest.jpg", "new", { name: "4-Stripe Orange Reflective Vest", category: "ppe", brand: "KimSafety", price: 1200 }],
  ["4Kg Dry powder Fire Extinguisher.png", "new", { name: "ABC Dry Powder Fire Extinguisher 4kg", category: "fire-safety", brand: "KimSafety", price: 8200 }],
  ["5Kg Carbon Dioxide Fire Extinguisher.jpg", "new", { name: "CO2 Fire Extinguisher 5kg", category: "fire-safety", brand: "KimSafety", price: 16500 }],
  ["9 kg dry powder extinguisher.jpg", "new", { name: "ABC Dry Powder Fire Extinguisher 9kg", category: "fire-safety", brand: "KimSafety", price: 12500 }],
  ["A2 Size Construction In Progress.jpg", "new", { name: "Construction In Progress Sign (A2)", category: "signs-labels", brand: "KimSafety", price: 1450 }],
  ["A2 Size Deep Excavation Signage.jpg", "new", { name: "Deep Excavation Warning Sign (A2)", category: "signs-labels", brand: "KimSafety", price: 1450 }],
  ["American Poly carbonate Industrial Glass.jpg", "new", { name: "American Polycarbonate Industrial Safety Glass", category: "construction-safety", brand: "American", price: 3800 }],
  ["Askari Baton.jpg", "new", { name: "Askari Security Baton", category: "security-equipment", brand: "KimSafety", price: 1800 }],
  ["Barricade_Caution Tapes 2\u2033 Yellow_Black.jpeg", "new", { name: "Barricade Caution Tape (Yellow/Black, 2\u2033)", category: "road-safety", brand: "KimSafety", price: 750 }],
  ["BARRIER TAPE_ SAFETY TAPE_ BARRICADE TAPE.jpg", "new", { name: "Barrier & Safety Barricade Tape", category: "road-safety", brand: "KimSafety", price: 650 }],
  ["Blue Medic Face Shield.jpg", "new", { name: "Medic Face Shield (Blue)", category: "medical-safety", brand: "KimSafety", price: 950 }],
  ["BRANDED FIRE MARSHAL REFLECTIVE VEST.jpg", "new", { name: "Fire Marshal Reflective Vest (Branded)", category: "fire-safety", brand: "KimSafety", price: 1500 }],
  ["Bump Cap Black Hivis Orange.jpg", "new", { name: "HiVis Bump Cap (Black/Orange)", category: "ppe", brand: "KimSafety", price: 1100 }],
  ["Chemical Spill Kit 28L Bag.jpg", "new", { name: "Chemical Spill Kit 28L (Bag)", category: "cleaning-hygiene", brand: "KimSafety", price: 8500 }],
  ["Construction Rigger Leather Gloves.jpg", "new", { name: "Construction Rigger Leather Gloves", category: "ppe", brand: "KimSafety", price: 1400 }],
  ["Designer Orange Reflector Jackets.jpg", "new", { name: "Designer Reflective Jacket (Orange)", category: "ppe", brand: "KimSafety", price: 3200 }],
  ["Designer Orange_Black Reflective Vest.jpg", "new", { name: "Designer Reflective Vest (Orange/Black)", category: "ppe", brand: "KimSafety", price: 1300 }],
  ["Electric Fence.jpg", "new", { name: "Electric Fence System", category: "security-equipment", brand: "KimSafety", price: 28000 }],
  ["Fire Action Plan.jpg", "new", { name: "Fire Action Plan Sign", category: "signs-labels", brand: "KimSafety", price: 1200 }],
  ["Fire Hose pipe.png", "new", { name: "Fire Hose Pipe", category: "fire-safety", brand: "KimSafety", price: 5500 }],
  ["Fire Point Sign.jpg", "new", { name: "Fire Point Sign", category: "signs-labels", brand: "KimSafety", price: 1200 }],
  ["Folded Wheel Chair.png", "new", { name: "Foldable Wheelchair", category: "medical-safety", brand: "KimSafety", price: 18500 }],
  ["Food & Medical Grade Hairnets in Kenya \u2013 Disposable Surgical & Catering Hair Caps.jpg", "new", { name: "Disposable Hairnets (Food & Medical Grade)", category: "food-safety", brand: "KimSafety", price: 600 }],
  ["Garrett Metal Detector.jpg", "new", { name: "Garrett Metal Detector", category: "security-equipment", brand: "Garrett", price: 38500 }],
  ["GREEN GENERAL PURPOSE INDUSTRIAL SAFETY GUMBOOT.jpg", "new", { name: "General Purpose Industrial Gumboot (Green)", category: "industrial-safety", brand: "KimSafety", price: 1900 }],
  ["Harness Double Hook With Shock Absorber.jpg", "new", { name: "Full Body Harness Double Hook with Shock Absorber", category: "construction-safety", brand: "KimSafety", price: 6200 }],
  ["Heat Detector.jpg", "new", { name: "Heat Detector", category: "fire-safety", brand: "KimSafety", price: 2600 }],
  ["Heavy Duty Chemical Resistant 22 Inch Rubber Gloves.jpg", "new", { name: "Heavy Duty Chemical Resistant Rubber Gloves 22\u2033", category: "cleaning-hygiene", brand: "KimSafety", price: 850 }],
  ["Heavy Duty Chemical Resistant gloves.jpg", "new", { name: "Heavy Duty Chemical Resistant Gloves", category: "cleaning-hygiene", brand: "KimSafety", price: 750 }],
  ["Heavy Duty Industrial Dungaree.jpg", "new", { name: "Heavy Duty Industrial Dungaree", category: "ppe", brand: "KimSafety", price: 3200 }],
  ["HIGH-QUALITY REFLECTIVE WINDBREAKER.jpg", "new", { name: "High-Quality Reflective Windbreaker", category: "ppe", brand: "KimSafety", price: 2400 }],
  ["HIVIEW SAFETY BOOT HTS4101.jpeg", "new", { name: "HIVIEW Safety Boot HTS4101", category: "industrial-safety", brand: "HIVIEW", price: 5200 }],
  ["Iron Multifolding Extension Ladder.jpg", "new", { name: "Iron Multifolding Extension Ladder", category: "tools", brand: "KimSafety", price: 12500 }],
  ["Jua Kali Booster Cable 2000 Amp.jpeg", "new", { name: "Jua Kali Booster Cable 2000 Amp", category: "electrical-safety", brand: "Jua Kali", price: 2500 }],
  ["Ladder.jpg", "new", { name: "Folding Aluminium Ladder", category: "tools", brand: "KimSafety", price: 9500 }],
  ["Latex Powdered Medical Examination Gloves.jpg", "new", { name: "Latex Powdered Medical Examination Gloves", category: "medical-safety", brand: "KimSafety", price: 1600 }],
  ["LED Strong Light Flashlight.jpg", "new", { name: "LED Strong Light Flashlight", category: "tools", brand: "KimSafety", price: 2200 }],
  ["LIGHT REFLECTIVE RIDERS JACKET.jpg", "new", { name: "Light Reflective Riders Jacket", category: "ppe", brand: "KimSafety", price: 2800 }],
  ["Lock Out.jpg", "new", { name: "Lock Out / Tag Out Sign", category: "signs-labels", brand: "KimSafety", price: 1100 }],
  ["LPG Safety Signage.gif", "new", { name: "LPG Safety Signage", category: "signs-labels", brand: "KimSafety", price: 1100 }],
  ["Medium Grey First Aid Kit.jpg", "new", { name: "First Aid Kit (Medium, Grey)", category: "emergency-response", brand: "KimSafety", price: 2800 }],
  ["First Aid Kit Stock, Supplies, Refill & Restocking Items.jpg", "new", { name: "First Aid Kit Stock, Refill & Restocking Supplies", category: "emergency-response", brand: "KimSafety", price: 4500 }],
  ["Men at Work Signs.jpg", "new", { name: "Men At Work Sign", category: "signs-labels", brand: "KimSafety", price: 1300 }],
  ["Power Mega Phone.jpg", "new", { name: "Power Megaphone", category: "security-equipment", brand: "KimSafety", price: 4200 }],
  ["PPE Signage.jpg", "new", { name: "PPE Required Signage", category: "signs-labels", brand: "KimSafety", price: 1200 }],
  ["Professional Stethoscope.jpg", "new", { name: "Professional Stethoscope", category: "medical-safety", brand: "KimSafety", price: 3800 }],
  ["PVC Dotted Cotton Gloves.jpg", "new", { name: "PVC Dotted Cotton Gloves", category: "cleaning-hygiene", brand: "KimSafety", price: 480 }],
  ["Rain Coat With Inner Lining.jpeg", "new", { name: "Rain Coat with Inner Lining", category: "ppe", brand: "KimSafety", price: 2800 }],
  ["Rain Coat.jpg", "new", { name: "Rain Coat", category: "ppe", brand: "KimSafety", price: 2400 }],
  ["Resends_Knicker Cut Resistant Gloves.jpeg", "new", { name: "Knicker Cut-Resistant Gloves", category: "ppe", brand: "Resends", price: 1600 }],
  ["Riders Chest Guard.jpg", "new", { name: "Riders Chest Guard", category: "ppe", brand: "KimSafety", price: 2500 }],
  ["Safety Jogger Best Boy Safety Boot.jpg", "new", { name: "Safety Jogger Best Boy Safety Boot", category: "industrial-safety", brand: "Safety Jogger", price: 5600 }],
  ["Safety Goggles.jpg", "new", { name: "Classic Safety Goggles", category: "ppe", brand: "KimSafety", price: 850 }],
  ["Safety Jogger Safety Manager.jpg", "new", { name: "Safety Jogger Safety Manager Boot", category: "industrial-safety", brand: "Safety Jogger", price: 6100 }],
  ["Safety Overalls.png", "new", { name: "Safety Overalls", category: "ppe", brand: "KimSafety", price: 2900 }],
  ["Sandak Gumboot.jpg", "new", { name: "Sandak Gumboot", category: "industrial-safety", brand: "Sandak", price: 2200 }],
  ["Security Whistle.jpg", "new", { name: "Security Whistle", category: "security-equipment", brand: "KimSafety", price: 350 }],
  ["Spine Board Stretcher.jpg", "new", { name: "Spine Board Stretcher", category: "emergency-response", brand: "KimSafety", price: 12500 }],
  ["Standard Foldable Wheelchair.jpg", "new", { name: "Standard Foldable Wheelchair", category: "medical-safety", brand: "KimSafety", price: 16500 }],
  ["Steel toe Gum Boot.jpg", "new", { name: "Steel Toe Gumboot", category: "industrial-safety", brand: "KimSafety", price: 2400 }],
  ["Stun Gun Self Defense Flashlight Torch- 288 Type.jpg", "new", { name: "Stun Gun Self-Defense Flashlight Torch 288", category: "security-equipment", brand: "KimSafety", price: 4800 }],
  ["Suggestion Box Mid Size.jpg", "new", { name: "Suggestion Box (Mid Size)", category: "security-equipment", brand: "KimSafety", price: 2600 }],
  ["Truck Traffic Reflective Warning Safety Tape.jpg", "new", { name: "Truck Traffic Reflective Warning Safety Tape", category: "road-safety", brand: "KimSafety", price: 900 }],
  ["Ultimate Plus Cut Resistant Gloves.jpeg", "new", { name: "Ultimate Plus Cut-Resistant Gloves", category: "ppe", brand: "KimSafety", price: 1900 }],
  ["Vaultex Dust Mask VB1.png", "new", { name: "Vaultex Dust Mask VB1", category: "ppe", brand: "Vaultex", price: 700 }],
  ["VAULTEX SAFETY BOOT.jpg", "new", { name: "Vaultex Safety Boot", category: "industrial-safety", brand: "Vaultex", price: 5000 }],
  ["Vaultex Safety Helmet.jpg", "new", { name: "Vaultex Safety Helmet", category: "industrial-safety", brand: "Vaultex", price: 1600 }],
  ["WELDING GOGGLES.jpg", "new", { name: "Welding Goggles", category: "ppe", brand: "KimSafety", price: 950 }],
  ["Wooden Suggestion Box.jpg", "new", { name: "Wooden Suggestion Box", category: "security-equipment", brand: "KimSafety", price: 3200 }],
  ["YAMATO JAPANESE QUALITY SAFETY SHOE.jpg", "new", { name: "Yamato Japanese Safety Shoe", category: "industrial-safety", brand: "Yamato", price: 4800 }],
];

// ---------- auto rules for unmatched new groups ----------
const CATEGORY_NAME = {
  "medical-safety": "Medical Safety",
  "industrial-safety": "Industrial Safety",
  ppe: "PPE",
  "fire-safety": "Fire Safety",
  "road-safety": "Road Safety",
  "construction-safety": "Construction Safety",
  "electrical-safety": "Electrical Safety",
  "laboratory-equipment": "Laboratory Equipment",
  "cleaning-hygiene": "Cleaning & Hygiene",
  "emergency-response": "Emergency Response",
  "marine-safety": "Marine Safety",
  "security-equipment": "Security Equipment",
  "food-safety": "Food Safety",
  "signs-labels": "Signs & Labels",
  tools: "Tools & Hardware",
};

const CAT_RULES = [
  [/chef|beard|hair|hairnet|food/i, "food-safety"],
  [/respirator|ear plug|earplug|ear muff|balaclava|welding|goggle|face shield|apron|cape|shoe cover/i, "ppe"],
  [/bandage|mask|stethoscope|wheelchair|medical/i, "medical-safety"],
  [/glove|nitrile|coverall/i, "ppe"],
  [/jacket|vest|overall|dustcoat|reflector|dungaree|rain/i, "ppe"],
  [/boot|shoe|gumboot/i, "industrial-safety"],
  [/helmet/i, "industrial-safety"],
  [/fire|extinguisher|co2|smoke|heat|hose/i, "fire-safety"],
  [/cone|traffic|barrier|barricade/i, "road-safety"],
  [/harness|lifeline|knee|fall/i, "construction-safety"],
  [/ladder|drill|rivet|printer|clock|closer|twine|yarn|strapping|pallet|bubble|cellotape|packaging|carton|woven|sack|stretch|receipt|shipping|label|paper|rubber band/i, "tools"],
  [/spill|cleaning|mop|broom|brush|pad|tissue|urinal|dryer|air freshener|mat|garbage|biodegradable|spray|bottle|neck/i, "cleaning-hygiene"],
  [/first aid|stretcher|spine|blanket/i, "emergency-response"],
  [/flotation|life/i, "marine-safety"],
  [/cctv|camera|baton|whistle|megaphone|stun|suggestion|fence|detector/i, "security-equipment"],
  [/sign|signage|tape|lock out/i, "signs-labels"],
  [/glass|excavation|progress|work/i, "signs-labels"],
];

const PRICE_RULES = [
  [/ladder/i, 12000],
  [/extinguisher/i, 9000],
  [/co2/i, 13500],
  [/helmet/i, 1500],
  [/glove/i, 1200],
  [/hair|hairnet/i, 450],
  [/balaclava|cover/i, 700],
  [/boot|shoe|gumboot/i, 4600],
  [/jacket|vest|overall|windbreaker|dungaree|dustcoat/i, 2600],
  [/apron|cape/i, 1500],
  [/mask|respirator/i, 800],
  [/ear/i, 2400],
  [/cellotape/i, 380],
  [/sign|signage|tape/i, 1200],
  [/closer|manual strapping/i, 12500],
  [/paper|roll|label|receipt/i, 900],
  [/cellotape/i, 380],
  [/bag|sack|packaging|bubble|stretch|twine|woven/i, 1500],
  [/carton/i, 3800],
  [/drill|rivet/i, 1900],
  [/printer/i, 55000],
  [/dryer/i, 16500],
  [/mop|broom|brush|sponge/i, 1200],
  [/clock/i, 4500],
  [/mat/i, 3200],
  [/air fresh|urinal|tissue|pad|spray/i, 850],
  [/bandage/i, 650],
  [/cap|hat/i, 550],
  [/garbage|biodegradable/i, 2500],
];

const BRAND_WORDS = ["vaultex", "safety jogger", "hiview", "yamato", "traffiglove", "krickwood", "garrett", "sandak", "jsp", "jua kali", "resends"];

function autoCategory(base) {
  for (const [re, cat] of CAT_RULES) if (re.test(base)) return cat;
  return "ppe";
}
function autoPrice(base, category) {
  for (const [re, price] of PRICE_RULES) if (re.test(base)) return price;
  return 1200;
}
function autoBrand(base) {
  const b = base.toLowerCase();
  for (const w of BRAND_WORDS) if (b.includes(w)) return titleCase(w);
  return "KimSafety";
}
function autoName(base) {
  let n = base.replace(/(\d+)_/g, "$1\u2033");
  n = titleCase(n);
  n = n.replace(/\s+/g, " ");
  n = n.replace(/\bUnbranded\b\s*/i, "");
  n = n.replace(/\s+\)/g, ")").replace(/\(\s+/g, "(");
  n = n.replace(/\s*\((\d+[a-z]{0,2})\)\s*$/i, " $1");
  return n.trim();
}

// ---------- main ----------
const files = fs.readdirSync(IMAGES_DIR);

// group by case-insensitive base name (strip " (N)" suffixes)
const groups = new Map();
for (const f of files) {
  const base = f.replace(/ \(\d+\)\.\w+$/, "").replace(/\.\w+$/, "");
  const key = base.toLowerCase();
  if (!groups.has(key)) groups.set(key, { base, files: [] });
  groups.get(key).files.push(f);
}
for (const g of groups.values()) {
  g.files.sort((a, b) => (a.includes(" (") ? 1 : 0) - (b.includes(" (") ? 1 : 0));
}

const productImages = {};
const galleries = {};
const newEntries = [];
const existing = parseExistingProducts();
const usedSlugs = new Set(existing.map((p) => slugify(p.name)));
const skuCounters = {};
for (const p of existing) {
  const m = p.sku.match(/^KS-([A-Z]+)-(\d+)$/);
  if (m) skuCounters[m[1]] = Math.max(skuCounters[m[1]] ?? 0, parseInt(m[2], 10));
}
let nextId = 200;
let hiviewSku = null;

function nextSku(prefix) {
  skuCounters[prefix] = (skuCounters[prefix] ?? 900) + 1;
  return `KS-${prefix}-${skuCounters[prefix]}`;
}
function freshSlug(name) {
  let slug = slugify(name);
  let n = slug;
  let i = 2;
  while (usedSlugs.has(n)) n = `${slug}-${i++}`;
  usedSlugs.add(n);
  return n;
}
function tagsFor(name, category) {
  const t = name.toLowerCase();
  const tags = [category.replace(/-/g, "")];
  const map = {
    helmet: "helmet", glove: "gloves", boot: "boots", shoe: "boots", gumboot: "boots", ladder: "ladder",
    fire: "fire", extinguisher: "extinguisher", sign: "signage", vest: "vest", jacket: "jacket",
    mask: "masks", respirator: "respirator", goggle: "goggles", tape: "tape", wheelchair: "wheelchair",
    stretcher: "stretcher", detector: "detector", harness: "harness", first: "first-aid", kit: "first-aid",
    cable: "electrical", fence: "fencing", whistle: "security", cctv: "cctv", camera: "cctv",
    nitrile: "nitrile", ear: "hearing", mop: "cleaning", broom: "cleaning", apron: "aprons",
    overall: "coveralls", dustcoat: "coveralls", pack: "packaging", carton: "packaging",
  };
  for (const [k, v] of Object.entries(map)) if (t.includes(k)) tags.push(v);
  return [...new Set(tags)].slice(0, 5);
}

function makeEntry(name, category, brand, price, mainFile) {
  const prefix = {
    "medical-safety": "MED", "industrial-safety": "IND", ppe: "PPE", "fire-safety": "FIR",
    "road-safety": "ROA", "construction-safety": "CON", "electrical-safety": "ELC",
    "laboratory-equipment": "LAB", "cleaning-hygiene": "CLN", "emergency-response": "EMR",
    "marine-safety": "MAR", "security-equipment": "SEC", "food-safety": "FOO",
    "signs-labels": "SIG", tools: "TOOL",
  }[category];
  const sku = nextSku(prefix);
  productImages[sku] = `/images/products/${encodeURI(mainFile)}`;
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
  const stock = 50 + (Math.abs(hash) % 220);
  const rating = Math.round((4.2 + (Math.abs(hash) % 8) / 10) * 10) / 10;
  newEntries.push({
    id: `p-${String(nextId++).padStart(3, "0")}`,
    sku,
    name,
    brand,
    category,
    categoryName: CATEGORY_NAME[category],
    price,
    stock,
    lowStockAt: 20,
    rating,
    reviews: 15 + (Math.abs(hash) % 160),
    sold: 120 + (Math.abs(hash) % 1100),
    tags: tagsFor(name, category),
    description: `${name}, quality-inspected at KimSafety's Nairobi warehouse and certified for professional use. Available in bulk with tiered corporate discounts and same-day dispatch within Nairobi.`,
  });
  return sku;
}

// 1) process curated groups (case-insensitive base lookup)
const curatedByBase = new Map();
for (const [file, action, extra] of CURATED) {
  const base = file.replace(/ \(\d+\)\.\w+$/, "").replace(/\.\w+$/, "");
  const key = base.toLowerCase();
  if (!curatedByBase.has(key)) curatedByBase.set(key, []);
  curatedByBase.get(key).push([file, action, extra]);
}

const handledGroups = new Set();
const matchedExisting = new Map(); // sku -> gallery files

for (const [key, { base, files }] of groups) {
  const curated = curatedByBase.get(key);
  if (!curated) continue;
  handledGroups.add(key);
  const main = curated[0];
  const angleFiles = files.filter((f) => f !== main[0]);
  if (main[1] === "skip") continue;
  if (main[1] === "map") {
    const sku = main[2];
    productImages[sku] = `/images/products/${encodeURI(main[0])}`;
    if (angleFiles.length) galleries[sku] = angleFiles.map((f) => `/images/products/${encodeURI(f)}`);
  } else {
    const { name, category, brand, price } = main[2];
    const sku = makeEntry(name, category, brand, price, main[0]);
    if (main[0] === "HIVIEW SAFETY BOOT HTS4101.jpeg") hiviewSku = sku;
    if (angleFiles.length) galleries[sku] = angleFiles.map((f) => `/images/products/${encodeURI(f)}`);
  }
}

// 2) HIVIEW extra angle (curated skip) — keep mapping to the HIVIEW product
for (const [file, action] of CURATED) {
  if (action === "skip" && hiviewSku && /HIVIEW SAFETY BOOT HTSO1/.test(file)) {
    galleries[hiviewSku] = [...(galleries[hiviewSku] ?? []), `/images/products/${encodeURI(file)}`];
  }
}

// 3) new groups: try match to existing products/images, else auto-create
const existingImageBases = new Map(); // slugified base -> { sku, base }
for (const [sku, path] of Object.entries(productImages)) {
  const f = decodeURIComponent(path.split("/").pop());
  const base = f.replace(/ \(\d+\)\.\w+$/, "").replace(/\.\w+$/, "");
  existingImageBases.set(slugify(base.toLowerCase()), { sku, base });
}

function bestMatch(toks, candidates) {
  let best = null;
  for (const c of candidates) {
    const inter = toks.filter((t) => c.toks.includes(t));
    const score = inter.length / Math.max(toks.length, 1);
    if (best === null || score > best.score) best = { score, inter: inter.length, toks: c.toks };
  }
  return best;
}

const productToks = existing.map((p) => ({ toks: tokens(p.name) }));
const imageToks = [...existingImageBases.values()].map(({ sku, base }) => ({ sku, toks: tokens(base) }));

let matchedCount = 0;
let autoCount = 0;
for (const [key, { base, files }] of groups) {
  if (handledGroups.has(key)) continue;
  const toks = tokens(base);
  const pMatch = bestMatch(toks, productToks);
  const iMatch = bestMatch(toks, imageToks);
  let sku = null;
  if (iMatch && iMatch.score >= 0.7) {
    sku = imageToks.find((t) => t.toks.join(" ") === iMatch.toks.join(" "))?.sku;
  } else if (pMatch && pMatch.score >= 0.7) {
    const matched = productToks.find((t) => t.toks.join(" ") === pMatch.toks.join(" "));
    sku = matched ? existing[productToks.indexOf(matched)]?.sku : null;
  }
  if (sku) {
    matchedCount++;
    productImages[sku] = productImages[sku] ?? `/images/products/${encodeURI(files[0])}`;
    galleries[sku] = [...(galleries[sku] ?? []), ...files.map((f) => `/images/products/${encodeURI(f)}`)];
  } else {
    autoCount++;
    const name = autoName(base);
    const category = autoCategory(base);
    const brand = autoBrand(base);
    const price = autoPrice(base, category);
    const newSku = makeEntry(name, category, brand, price, files[0]);
    if (files.length > 1) galleries[newSku] = files.slice(1).map((f) => `/images/products/${encodeURI(f)}`);
  }
}

// ---------- emit mapping ----------
let out = `// Generated mapping: product SKU -> real product photo in /public/images/products
export const productImages: Record<string, string> = {
`;
for (const [sku, path] of Object.entries(productImages)) out += `  "${sku}": "${path}",\n`;
out += `};

// Extra gallery angles for products photographed more than once
export const productGalleries: Record<string, string[]> = {
`;
for (const [sku, paths] of Object.entries(galleries)) {
  if (paths.length) out += `  "${sku}": ["${paths.join('", "')}"],\n`;
}
out += `};
`;
fs.writeFileSync(OUT_MAPPING, out);

// ---------- emit entries ----------
function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
newEntries.sort((a, b) => a.sku.localeCompare(b.sku));
let entries = "";
for (const e of newEntries) {
  entries += `  p({
    id: "${e.id}", sku: "${e.sku}", name: "${esc(e.name)}", brand: "${esc(e.brand)}", category: "${e.category}", categoryName: "${e.categoryName}",
    price: ${e.price}, stock: ${e.stock}, lowStockAt: ${e.lowStockAt}, rating: ${e.rating}, reviews: ${e.reviews}, sold: ${e.sold},
    tags: ["${e.tags.map(esc).join('", "')}"],
    description: "${esc(e.description)}",
  }),
`;
}
fs.writeFileSync(OUT_ENTRIES, entries);

console.log("images:", files.length, "| groups:", groups.size);
console.log("existing product images:", Object.keys(productImages).filter((s) => existing.some((p) => p.sku === s)).length);
console.log("new products (curated+auto):", newEntries.length, "| auto-created:", autoCount, "| matched to existing:", matchedCount);
console.log("galleries:", Object.keys(galleries).length);
