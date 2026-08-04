import type { Testimonial, Guide } from "../types";

export const testimonials: Testimonial[] = [
  {
    quote:
      "KimSafety has been our sole PPE supplier for two years. Their bulk pricing, delivery reliability and genuine certified products make procurement effortless for our 400+ staff.",
    name: "Grace Wanjiku",
    role: "Procurement Manager",
    company: "Nairobi Metropolitan Hospital",
    initials: "GW",
  },
  {
    quote:
      "From fire extinguishers to full fall-arrest kits, we equip entire sites from one order. The corporate quotation process is fast and our audit documentation is always ready.",
    name: "Daniel Otieno",
    role: "HSE Director",
    company: "Sterling Construction Ltd",
    initials: "DO",
  },
  {
    quote:
      "Their lab equipment range is impressive and everything arrived calibrated and certified. Delivery to our Eldoret campus took just 2 days.",
    name: "Dr. Amina Hassan",
    role: "Head of Laboratory",
    company: "Rift Valley University",
    initials: "AH",
  },
  {
    quote:
      "As an NGO running field clinics, we rely on KimSafety for medical supplies at honest prices. Their team understands emergency timelines and never lets us down.",
    name: "Samuel Kiprop",
    role: "Logistics Coordinator",
    company: "HealthBridge Foundation",
    initials: "SK",
  },
];

export const guides: Guide[] = [
  {
    slug: "how-to-choose-safety-helmets",
    title: "How to Choose the Right Safety Helmet",
    category: "Buying Guide",
    readTime: "6 min read",
    excerpt:
      "Standards, shell materials, suspension classes and the checks inspectors will make on your site helmets.",
    icon: "helmet",
    image: "/images/products/Construction Helmets.jpg",
  },
  {
    slug: "ppe-selection-by-industry",
    title: "PPE Selection by Industry: The Complete Matrix",
    category: "PPE Selection",
    readTime: "10 min read",
    excerpt:
      "A practical field guide mapping hazards to the right PPE for construction, healthcare, manufacturing and more.",
    icon: "ppe",
    image: "/images/hero/hero1.jpg",
  },
  {
    slug: "kenya-occupational-safety-laws",
    title: "Kenya's OSH Act & Workplace Safety Laws, Explained",
    category: "Regulations",
    readTime: "8 min read",
    excerpt:
      "What the Occupational Safety and Health Act 2007 requires of every Kenyan employer — and how to comply.",
    icon: "law",
    image: "/images/hero/hero4.jpg",
  },
  {
    slug: "fire-extinguisher-inspection-checklist",
    title: "Monthly Fire Extinguisher Inspection Checklist",
    category: "Safety Standards",
    readTime: "5 min read",
    excerpt:
      "The 8-point monthly check every facility manager should run, plus annual servicing requirements.",
    icon: "fire",
    image: "/images/products/6KG DRY POWDER FIRE EXTINGUISHER.jpg",
  },
  {
    slug: "glove-materials-explained",
    title: "Nitrile, Latex or Vinyl? Glove Materials Explained",
    category: "Buying Guide",
    readTime: "7 min read",
    excerpt:
      "Chemical resistance, allergen profiles and cost — how to pick the right glove for each task.",
    icon: "glove",
    image: "/images/products/Assorted Industrial Gloves.jpg",
  },
  {
    slug: "working-at-height-checklist",
    title: "Working at Height: The 12-Point Site Checklist",
    category: "Training",
    readTime: "9 min read",
    excerpt:
      "From harness inspection to edge protection, the checklist we give every site safety officer.",
    icon: "height",
    image: "/images/products/Double Hook Work Man Full Body Safety Harness.jpg",
  },
];

export const heroSlides = [
  {
    kicker: "Industrial PPE · Certified & Genuine",
    title: "Protect Every Worker, Every Shift",
    subtitle:
      "3M, Honeywell, Ansell, Uvex and MSA — certified personal protective equipment delivered nationwide within 24–72 hours.",
    cta: "Shop PPE",
    cta2: "Request Quote",
    art: "ppe",
    bg: "/images/hero/hero1.jpg",
  },
  {
    kicker: "Medical Safety · Hospital Grade",
    title: "Clinical Supplies Kenyan Hospitals Trust",
    subtitle:
      "Examination gloves, masks, isolation gowns and laboratory equipment with full certification documentation.",
    cta: "Shop Medical",
    cta2: "Talk to a Specialist",
    art: "medical",
    bg: "/images/hero/hero2.jpg",
  },
  {
    kicker: "Bulk & Corporate · Up to 30% Off",
    title: "Bulk Discounts for Teams & Projects",
    subtitle:
      "Tiered pricing, negotiated corporate rates, tax invoices and dedicated account managers for organizations.",
    cta: "See Pricing",
    cta2: "Request Corporate Quotation",
    art: "bulk",
    bg: "/images/hero/hero3.jpg",
  },
  {
    kicker: "Government & NGO Supply",
    title: "Trusted Supplier to Public Institutions",
    subtitle:
      "Full tender documentation, framework-ready pricing and dependable delivery schedules for government agencies and NGOs.",
    cta: "Corporate Portal",
    cta2: "Get a Quotation",
    art: "gov",
    bg: "/images/hero/hero4.jpg",
  },
];
