// Shared fallback content for knowledge guides that have no editor-written
// body yet. Used by BOTH the public guide page and the downloadable guide
// PDF so the two never drift apart.
export function guideFallbackSections(): { heading: string; body: string; points?: string[]; table?: string[][] }[] {
  return [
    {
      heading: "Why this matters",
      body: `Every Kenyan workplace is bound by the Occupational Safety and Health Act, 2007. Under Section 6, employers must provide — free of charge — suitable protective equipment and ensure it is properly used and maintained. This guide translates the requirements into a practical purchasing plan.`,
      points: [
        "Non-compliance risks fines, stop-work orders and liability in the event of injury.",
        "Buying certified equipment protects both the worker and the organization's legal position.",
        "Correct selection and fit are as important as the equipment itself.",
      ],
    },
    {
      heading: "Key selection criteria",
      body: `Selection starts with a hazard assessment of the task, environment and worker. The table below shows the common hazards and the corresponding protective equipment to budget for.`,
      table: [
        ["Hazard", "Required protection", "Typical standard"],
        ["Impact / falling objects", "Safety helmet (EN 397)", "EN 397"],
        ["Chemical splash", "Goggles or face shield (EN 166)", "EN 166"],
        ["Noise above 85 dB", "Ear muffs or plugs (SNR 31)", "EN 352"],
        ["Falling from height", "Full-body harness (EN 361)", "EN 361"],
        ["Cuts & abrasions", "Gloves (EN 388)", "EN 388"],
        ["Electrical work", "Insulated gloves & tools", "IEC 60900"],
      ],
    },
    {
      heading: "Budgeting for compliance",
      body: `A realistic PPE budget should include inspection, replacement and training costs — typically 15–25% above the purchase price. KimSafety's bulk pricing tiers make full-team outfitting predictable and cost-effective.`,
      points: [
        "Tier 1 (1–9 units): standard pricing",
        "Tier 2 (10–49 units): 5% discount",
        "Tier 3 (50–199 units): 9% discount",
        "Tier 4 (200+ units): 13%+ discount, negotiable",
      ],
    },
  ];
}
