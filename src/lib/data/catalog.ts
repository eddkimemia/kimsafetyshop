import type { Category, Brand } from "../types";

export const categories: Category[] = [
  {
    slug: "medical-safety",
    name: "Medical Safety",
    tagline: "Gloves, masks, gowns & clinical essentials",
    art: "medical",
    industries: ["Hospitals", "Clinics", "Laboratories", "NGOs"],
    featured: ["Nitrilution Exam Gloves", "Surgical Face Masks", "Isolation Gowns"],
    description:
      "Hospital-grade protective equipment trusted by Kenyan hospitals, clinics and laboratories — from nitrile exam gloves to surgical masks and isolation gowns.",
  },
  {
    slug: "industrial-safety",
    name: "Industrial Safety",
    tagline: "Helmets, boots, eyewear & workwear",
    art: "industrial",
    industries: ["Manufacturing", "Mining", "Warehouses", "Construction"],
    featured: ["Vanguard Safety Helmet", "GripTech Work Boots", "SafEyes Goggles"],
    description:
      "Complete industrial PPE range — head, eye, foot and body protection engineered for Kenya's toughest workplaces.",
  },
  {
    slug: "ppe",
    name: "PPE",
    tagline: "Personal protective equipment for every job",
    art: "ppe",
    industries: ["Construction", "Manufacturing", "Hotels", "Cleaning"],
    featured: ["Nova Respirator", "FlexiGlove Nitrile", "EarGuard Pro Muffs"],
    description:
      "Respirators, gloves, hearing protection and full-body PPE from world-leading brands, certified to international safety standards.",
  },
  {
    slug: "fire-safety",
    name: "Fire Safety",
    tagline: "Extinguishers, alarms & evacuation",
    art: "fire",
    industries: ["Hotels", "Schools", "Offices", "Factories"],
    featured: ["FireGuard 6kg Extinguisher", "SmartAlert Smoke Detector", "ExitMaster Signage"],
    description:
      "Fire extinguishers, detection, suppression and evacuation equipment that keep people and property safe — plus inspection services.",
  },
  {
    slug: "road-safety",
    name: "Road Safety",
    tagline: "Cones, vests, barriers & signage",
    art: "road",
    industries: ["Construction", "Government", "Logistics"],
    featured: ["TrafficPro Cones", "HiVis Reflective Vests", "BarrierLite Barriers"],
    description:
      "Traffic management and road safety equipment compliant with KeNHA and county specifications for worksites across Kenya.",
  },
  {
    slug: "construction-safety",
    name: "Construction Safety",
    tagline: "Full-site protection solutions",
    art: "construction",
    industries: ["Construction", "Infrastructure", "Contractors"],
    featured: ["Vanguard Safety Helmet", "GripTech Work Boots", "HarnessMax Fall Protection"],
    description:
      "Site-ready safety gear — helmets, harnesses, boots and signage that meet NCA project compliance requirements.",
  },
  {
    slug: "electrical-safety",
    name: "Electrical Safety",
    tagline: "Insulated tools, gloves & testing",
    art: "electrical",
    industries: ["Energy", "Telecom", "Maintenance"],
    featured: ["VoltSafe Insulated Gloves", "InsulTool Screwdrivers", "TestSafe Voltage Tester"],
    description:
      "Arc-flash and shock protection — insulated gloves, mats, tools and testing equipment certified to IEC 60900 and beyond.",
  },
  {
    slug: "laboratory-equipment",
    name: "Laboratory Equipment",
    tagline: "Precision instruments & lab safety",
    art: "lab",
    industries: ["Laboratories", "Schools", "Research", "Pharma"],
    featured: ["ProLab Microscopes", "LabGuard Safety Glasses", "ChemShield Aprons"],
    description:
      "Lab instruments, glassware, safety eyewear and contamination control for schools, research institutes and pharma labs.",
  },
  {
    slug: "cleaning-hygiene",
    name: "Cleaning & Hygiene",
    tagline: "Janitorial supplies & sanitation",
    art: "cleaning",
    industries: ["Hotels", "Facilities", "Hospitals"],
    featured: ["Sanix Disinfectant", "ComfortGrip Gloves", "SurfaceCare Wipes"],
    description:
      "Professional cleaning chemicals, equipment and hygiene consumables for facilities management companies and hotels.",
  },
  {
    slug: "emergency-response",
    name: "Emergency Response",
    tagline: "First aid, rescue & emergency kits",
    art: "firstaid",
    industries: ["NGOs", "Government", "Oil & Gas"],
    featured: ["RescuePro First Aid Kit", "SurviveAl Emergency Blanket", "SirenX Stretcher"],
    description:
      "First aid kits, rescue tools and emergency response gear configured for workplace, field and disaster-response teams.",
  },
  {
    slug: "marine-safety",
    name: "Marine Safety",
    tagline: "Life jackets, floats & rescue gear",
    art: "marine",
    industries: ["Fisheries", "Ports", "Tourism"],
    featured: ["AquaGuard Life Jackets", "FloatMaster Buoys", "SeaSafe Throw Lines"],
    description:
      "Approved life jackets, lifebuoys and marine rescue equipment for fishing, ports and lake transport operators.",
  },
  {
    slug: "security-equipment",
    name: "Security Equipment",
    tagline: "Surveillance, guarding & access",
    art: "security",
    industries: ["Security Firms", "Corporate", "Real Estate"],
    featured: ["WatchTower Cameras", "GuardPro Jackets", "AccessKey Control Systems"],
    description:
      "Security cameras, guard equipment and access control solutions for security firms, malls and gated communities.",
  },
  {
    slug: "food-safety",
    name: "Food Safety",
    tagline: "Food handling & processing safety",
    art: "food",
    industries: ["Food Processing", "Hotels", "Restaurants"],
    featured: ["FoodSafe Gloves", "Sanix Surface Wipes", "TempGuard Thermometers"],
    description:
      "Food-grade gloves, thermometers, hygiene and sanitation supplies for kitchens and food processing plants.",
  },
  {
    slug: "signs-labels",
    name: "Signs & Labels",
    tagline: "Warning, mandatory & info signage",
    art: "signs",
    industries: ["Factories", "Warehouses", "Schools"],
    featured: ["ExitMaster Signage", "WarningLite Hazard Signs", "FloorMark Tapes"],
    description:
      "ISO 7010 compliant safety signs, floor marking tapes and label printers to keep facilities compliant and clear.",
  },
  {
    slug: "tools",
    name: "Tools",
    tagline: "Professional hand tools & equipment",
    art: "tools",
    industries: ["Maintenance", "Construction", "Engineering"],
    featured: ["InsulTool Screwdrivers", "ProGrip Pliers", "HammerPro Hammers"],
    description:
      "Insulated and professional-grade hand tools for maintenance teams and engineers.",
  },
];

export const brands: Brand[] = [
  { slug: "3m", name: "3M", tagline: "Global innovation in safety", origin: "USA", image: "/images/brands/3m.jpg" },
  { slug: "honeywell", name: "Honeywell", tagline: "Industrial safety leader", origin: "USA", image: "/images/brands/honeywell.jpg" },
  { slug: "ansell", name: "Ansell", tagline: "Hand protection specialists", origin: "Australia", image: "/images/brands/ansell.jpg" },
  { slug: "uvex", name: "Uvex", tagline: "Premium eye & head protection", origin: "Germany", image: "/images/brands/uvex.jpg" },
  { slug: "msa", name: "MSA", tagline: "Respiratory & fall protection", origin: "USA", image: "/images/brands/msalogo.jpg" },
  { slug: "draeger", name: "Dräger", tagline: "Medical & gas detection", origin: "Germany", image: "/images/brands/draeger.jpg" },
  { slug: "kimberly-clark", name: "Kimberly-Clark", tagline: "Professional hygiene", origin: "USA", image: "/images/brands/kimberly_clark.jpg" },
  { slug: "dupont", name: "DuPont", tagline: "Protective apparel", origin: "USA", image: "/images/brands/dupont.jpg" },
  { slug: "karam", name: "Karam", tagline: "India's largest PPE maker", origin: "India", image: "/images/brands/karam.jpg" },
  { slug: "delta-plus", name: "Delta Plus", tagline: "Full-body protection", origin: "France", image: "/images/brands/delta-plus.jpg" },
  { slug: "goliath", name: "Goliath", tagline: "Heavy-duty workwear", origin: "Kenya", image: "/images/brands/goliath.png" },
  { slug: "jsp", name: "JSP", tagline: "Head & respiratory protection", origin: "UK", image: "/images/brands/jsp.png" },
  { slug: "portwest", name: "Portwest", tagline: "Workwear & PPE specialists", origin: "Ireland", image: "/images/brands/portwest.png" },
  { slug: "protecta", name: "Protecta", tagline: "Fall protection systems", origin: "USA", image: "/images/brands/protecta.png" },
  { slug: "safety-jogger", name: "Safety Jogger", tagline: "Certified safety footwear", origin: "Portugal", image: "/images/brands/safety-jogger.png" },
  { slug: "vaultex", name: "Vaultex", tagline: "Protective gear made for Africa", origin: "Kenya", image: "/images/brands/vaultex.png" },
];

export const megaCategories = [
  { title: "Medical Safety", items: ["Examination Gloves", "Surgical Masks", "Isolation Gowns", "Syringes & Needles", "Stethoscopes", "Disinfectants"] },
  { title: "Industrial Safety", items: ["Safety Helmets", "Safety Boots", "Safety Goggles", "Coveralls", "Reflective Vests", "Face Shields"] },
  { title: "Road Safety", items: ["Traffic Cones", "Reflective Vests", "Barriers", "Delineators", "Speed Bumps", "Warning Tapes"] },
  { title: "Construction Safety", items: ["Helmets", "Harnesses", "Safety Nets", "Scaffold Tags", "Knee Pads", "Site Signage"] },
  { title: "Fire Safety", items: ["Fire Extinguishers", "Smoke Detectors", "Fire Blankets", "Hose Reels", "Exit Signs", "Fire Cabinets"] },
  { title: "Electrical Safety", items: ["Insulated Gloves", "Insulated Tools", "Voltage Testers", "Arc Flash Suits", "Rubber Mats", "Lockout Kits"] },
  { title: "Laboratory Equipment", items: ["Microscopes", "Centrifuges", "Pipettes", "Lab Glassware", "Bunsen Burners", "Lab Coats"] },
  { title: "Cleaning & Hygiene", items: ["Disinfectants", "Cleaning Gloves", "Mops & Buckets", "Dispensers", "Hand Sanitizers", "Wipes"] },
  { title: "Emergency Response", items: ["First Aid Kits", "Stretchers", "Emergency Blankets", "Splints", "Defibrillators", "Rescue Tools"] },
  { title: "Marine Safety", items: ["Life Jackets", "Life Buoys", "Throw Lines", "Flares", "Marine Vests", "Floatation Suits"] },
  { title: "Security Equipment", items: ["CCTV Cameras", "Security Vests", "Searchlights", "Walkie Talkies", "Bollards", "Access Control"] },
  { title: "Food Safety", items: ["Food Gloves", "Hair Nets", "Thermometers", "Aprons", "Shoe Covers", "Sanitisers"] },
  { title: "PPE", items: ["Respirators", "Nitrile Gloves", "Ear Protection", "Coveralls", "Knee Pads", "Body Harnesses"] },
  { title: "Tools", items: ["Insulated Tools", "Pliers", "Screwdrivers", "Hammers", "Measuring Tools", "Tool Belts"] },
  { title: "Signs & Labels", items: ["Warning Signs", "Mandatory Signs", "Prohibition Signs", "Floor Tapes", "Exit Signs", "Tag Printers"] },
];
