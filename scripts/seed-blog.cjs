// Seed 10 detailed, SEO-rich blog posts into data/kimsafety.db
// Usage: node scripts/seed-blog.cjs
const Database = require("better-sqlite3");
const { randomUUID } = require("crypto");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "kimsafety.db");
const db = new Database(DB_PATH, { fileMustExist: true });

const now = new Date().toISOString();
const day = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
};

const posts = [
  {
    slug: "kenya-ppe-buyers-guide-2026",
    title: "The Complete PPE Buyer's Guide for Kenyan Workplaces (2026)",
    category: "Buying Guide",
    excerpt:
      "How to buy certified PPE in Kenya in 2026 — standards, certification checks, sizing, bulk pricing and where counterfeit gear hides. Everything a procurement officer or safety manager needs before placing an order.",
    read_time: "12 min read",
    author: "KimSafety HSE Team",
    cover: "/images/hero/hero1.jpg",
    created_at: day(3),
    content: `
<p>Kenya's construction, manufacturing and healthcare sectors are growing fast — and so is the demand for certified personal protective equipment (PPE). But buying PPE in Kenya is not as simple as picking the cheapest pair of gloves. Counterfeit products, expired certifications and wrong sizing cost businesses millions in fines and, far worse, put workers at risk.</p>
<p>This guide walks procurement officers, HSE managers and business owners through every step of buying PPE in Kenya in 2026 — from understanding the law to verifying certification and negotiating bulk pricing.</p>

<h2>What Kenyan law requires of you</h2>
<p>The <strong>Occupational Safety and Health Act, 2007</strong> (OSH Act) is the foundation. Under <strong>Section 6</strong>, every employer must provide suitable protective equipment to employees free of charge, and ensure it is properly used and maintained. The Workplace Injury and Benefits Act, 2007 adds financial teeth: employers who fail to protect workers can be liable for compensation claims.</p>
<p>The Directorate of Occupational Safety and Health Services (DOSHS) enforces these laws. In practice, inspectors check:</p>
<ul>
<li>That PPE is provided and replaced at no cost to the worker.</li>
<li>That equipment carries recognised certification marks (KEBS, CE, EN, ANSI).</li>
<li>That training on correct use and fit has been given.</li>
<li>That inspection and replacement records are maintained.</li>
</ul>

<h2>The certification pyramid: what actually proves quality</h2>
<p>Not all marks are equal. In Kenya, the hierarchy looks like this:</p>
<ul>
<li><strong>KEBS standardisation mark</strong> — the local gold standard for products manufactured in or imported into Kenya.</li>
<li><strong>CE marking</strong> — indicates conformity with European health and safety directives (mandatory for PPE sold in the EU).</li>
<li><strong>EN standards</strong> — the technical test standards themselves, e.g. EN 397 for helmets, EN 388 for gloves, EN 166 for goggles.</li>
<li><strong>ANSI/ISEA</strong> — American equivalent standards, common on imported gear.</li>
</ul>
<p>A genuine product will usually list its test standard on the product itself or its packaging. If you cannot find a standard number anywhere — treat it as a red flag.</p>

<h2>Matching PPE to the hazard, not the budget</h2>
<p>The best procurement starts with a hazard assessment, not a price list. A quick rule of thumb:</p>
<ul>
<li><strong>Impact and falling objects</strong> → certified safety helmets (EN 397).</li>
<li><strong>Chemical splash</strong> → goggles or face shields (EN 166).</li>
<li><strong>Dust, fumes and gases</strong> → respirators with the correct filter rating.</li>
<li><strong>Falls from height</strong> → full-body harnesses, lanyards and anchor points (EN 361).</li>
<li><strong>Cuts and abrasions</strong> → cut-resistant gloves (EN 388).</li>
<li><strong>Noise above 85 dB</strong> → hearing protection with adequate SNR.</li>
</ul>
<p>You can find a full mapping in our <a href="/knowledge/ppe-selection-by-industry">PPE Selection by Industry matrix</a>.</p>

<h2>Why sizing and fit matter more than the label</h2>
<p>PPE that does not fit is PPE that does not protect. A loose helmet shifts on impact. A baggy harness can cause a worker to slip out during a fall. Buy from suppliers who stock full size ranges and, ideally, who will help with fitting. For items like respirators, a proper seal test is essential — see our guide on <a href="/knowledge/working-at-height-checklist">working at height</a> and respiratory protection for the details.</p>

<h2>Bulk buying: the smart way to cut costs</h2>
<p>Volume pricing is where Kenyan organisations save the most. Most suppliers — KimSafety included — work in tiers:</p>
<ul>
<li>1–9 units: standard retail pricing.</li>
<li>10–49 units: modest discount (around 5%).</li>
<li>50–199 units: 9%+ discount.</li>
<li>200+ units: negotiable rates, sometimes beyond 13%.</li>
</ul>
<p>For government agencies, hospitals and contractors, request a formal <a href="/quote">corporate quotation</a> — you get negotiated rates plus tender-ready documentation, tax invoices and delivery scheduling across all 47 counties.</p>

<h2>Checklist before you buy</h2>
<ul>
<li>Has the supplier provided certification documents for this batch?</li>
<li>Is the standard number printed on the product or packaging?</li>
<li>Does the supplier hold stock in Kenya (no long import lead times)?</li>
<li>Is a warranty or replacement policy offered?</li>
<li>Can the supplier deliver and, if needed, train your team?</li>
</ul>

<h2>Where to start</h2>
<p>Browse the certified range at <a href="/search">KimSafety's shop</a> — every product page lists its standards, stock levels and honest pricing. And when you are ready to buy in volume, <a href="/quote">request a quotation</a> and our corporate desk will respond within 4 business hours.</p>
`,
  },
  {
    slug: "fire-extinguisher-types-kenya",
    title: "Fire Extinguisher Types in Kenya: ABC, CO2, Foam and When to Use Each",
    category: "Fire Safety",
    excerpt:
      "ABC dry powder, CO2, foam and water extinguishers do very different jobs. This guide explains the fire classes, the right extinguisher for every Kenyan workplace and the maintenance rules that keep you compliant.",
    read_time: "9 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/6KG DRY POWDER FIRE EXTINGUISHER.jpg",
    created_at: day(10),
    content: `
<p>Fire extinguishers are the most visible safety device in any Kenyan building — and the most misunderstood. Choose the wrong type and a small fire can become an uncontrollable one. Choose the right type, and a trained employee can stop a blaze in seconds.</p>

<h2>First: understand the fire classes</h2>
<p>Fires are classified by what is burning. Kenyan signage and extinguishers follow the international colour-coded system:</p>
<ul>
<li><strong>Class A</strong> — ordinary combustibles: wood, paper, cloth, plastics.</li>
<li><strong>Class B</strong> — flammable liquids: petrol, diesel, solvents, cooking oil.</li>
<li><strong>Class C</strong> — gases: LPG, acetylene, methane.</li>
<li><strong>Class D</strong> — combustible metals: magnesium, aluminium powder (rare on normal sites).</li>
<li><strong>Class F</strong> — cooking oils and fats (deep fryers).</li>
<li><strong>Electrical fires</strong> — energised equipment; not a class, but critical when selecting.</li>
</ul>

<h2>The main types sold in Kenya</h2>
<h3>ABC dry powder</h3>
<p>The workhorse of Kenyan workplaces. One unit handles classes A, B and C plus live electrical equipment. Cheap, effective and available everywhere. Its downsides: powder residue is messy and can damage electronics and machinery.</p>
<p><strong>Best for:</strong> general offices, warehouses, factories, shops and vehicles. Our <a href="/product/KS-FIR-4001">6kg ABC dry powder extinguisher</a> is the most common choice for medium facilities.</p>

<h3>CO2 (carbon dioxide)</h3>
<p>Leaves no residue at all, which makes it the standard for server rooms, laboratories, electrical panels and kitchens. Discharges as freezing gas and suffocates the fire. Weaker against deep-seated class A fires.</p>
<p><strong>Best for:</strong> electrical rooms, IT centres, laboratories, catering.</p>

<h3>Foam</h3>
<p>Excellent against flammable liquid fires (class B) and works on class A too. Forms a blanket that prevents re-ignition. Common in fuel depots, workshops and processing plants.</p>

<h3>Water</h3>
<p>Class A only — and dangerous on electrical or oil fires. Still useful in some industrial settings, but being steadily replaced by multi-purpose units.</p>

<h2>How many do you need?</h2>
<p>Kenyan fire safety practice, aligned with international guidance, recommends:</p>
<ul>
<li>A minimum of <strong>one 6kg ABC extinguisher per 200 m²</strong> of floor space.</li>
<li>Extinguishers within <strong>30 metres of travel</strong> at all times.</li>
<li>Extinguishers near specific hazards: kitchens, generators, fuel storage, electrical panels.</li>
<li>At least one extinguisher per floor in multi-storey buildings.</li>
</ul>
<p>Local authorities and insurance firms often require documented compliance — keep a site map showing extinguisher positions and their last inspection dates.</p>

<h2>Maintenance: the monthly 8-point check</h2>
<p>Follow our detailed <a href="/knowledge/fire-extinguisher-inspection-checklist">monthly inspection checklist</a>. In short:</p>
<ul>
<li>Pressure gauge in the green zone.</li>
<li>Safety pin and tamper seal intact.</li>
<li>No dents, corrosion or leaks on the cylinder.</li>
<li>Hose and nozzle clear of blockages.</li>
<li>Weight consistent with the service label.</li>
<li>Access not blocked and signage visible.</li>
<li>Service tag current (professional servicing every 1–2 years).</li>
<li>Staff trained on how to use it.</li>
</ul>
<p>Use the acronym <strong>PASS</strong> for training: <strong>P</strong>ull the pin, <strong>A</strong>im at the base, <strong>S</strong>queeze the handle, <strong>S</strong>weep side to side.</p>

<h2>Buying new or refilling</h2>
<p>Only buy from suppliers who can show certification and a current service network. KimSafety supplies <a href="/search?category=fire-safety">certified extinguishers and fire safety equipment</a> nationwide, with refill and maintenance arrangements through our partners.</p>
`,
  },
  {
    slug: "nitrile-vs-latex-vs-vinyl-gloves",
    title: "Nitrile vs Latex vs Vinyl Gloves: The Definitive Comparison for Kenyan Buyers",
    category: "Medical Safety",
    excerpt:
      "Chemical resistance, allergen profiles, cost and durability — we compare nitrile, latex and vinyl gloves line by line so Kenyan clinics, factories and food businesses choose the right glove for every task.",
    read_time: "8 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/Assorted Industrial Gloves.jpg",
    created_at: day(17),
    content: `
<p>Gloves are the most purchased item of PPE in Kenya — used by hospitals, laboratories, food processors, cleaners and industrial workers alike. Yet most buyers pick by price alone. This comparison covers the three dominant materials so you can match the glove to the task.</p>

<h2>Nitrile gloves</h2>
<p>Synthetic rubber with outstanding resistance to oils, solvents and a wide range of chemicals. Nitrile is now the global standard for medical examination and industrial tasks.</p>
<ul>
<li><strong>Chemical resistance:</strong> excellent against oils, fuels, acids and bases.</li>
<li><strong>Puncture resistance:</strong> roughly 3–5× stronger than latex.</li>
<li><strong>Allergens:</strong> latex-free — safe for workers and patients with allergies.</li>
<li><strong>Cost:</strong> mid-range; the best value per task when durability is counted.</li>
<li><strong>Fit:</strong> snug, with good dexterity after a short break-in.</li>
</ul>
<p><strong>Best for:</strong> healthcare, laboratories, automotive, cleaning and any task involving chemicals. See the <a href="/product/KS-MED-1001">nitrile exam gloves</a> range used by Kenyan hospitals.</p>

<h2>Latex gloves</h2>
<p>Natural rubber — the original medical glove. Offers the best tactile sensitivity and elasticity, which is why surgeons still prefer it.</p>
<ul>
<li><strong>Chemical resistance:</strong> good against water-based chemicals, weak against oils and solvents.</li>
<li><strong>Tear/puncture:</strong> moderate; less resistant than nitrile.</li>
<li><strong>Allergens:</strong> latex proteins cause type I allergies in a significant minority of healthcare workers — a growing liability.</li>
<li><strong>Cost:</strong> often the cheapest at point of purchase.</li>
<li><strong>Fit:</strong> excellent elasticity and sensitivity.</li>
</ul>
<p><strong>Best for:</strong> surgical use and tasks needing maximum touch sensitivity — where allergy risk has been assessed.</p>

<h2>Vinyl gloves</h2>
<p>Made from PVC, vinyl gloves are a low-cost option for short, low-risk tasks. They are loose-fitting and offer minimal chemical or puncture protection.</p>
<ul>
<li><strong>Chemical resistance:</strong> weak against most solvents and acids.</li>
<li><strong>Puncture resistance:</strong> low; tears easily.</li>
<li><strong>Allergens:</strong> latex-free (no protein allergy, though some plasticisers have come under scrutiny).</li>
<li><strong>Cost:</strong> the cheapest option.</li>
<li><strong>Fit:</strong> loose — dexterity is noticeably poorer.</li>
</ul>
<p><strong>Best for:</strong> food handling, light cleaning and guest-facing tasks with brief contact, where cost sensitivity is highest.</p>

<h2>The side-by-side decision table</h2>
<table>
<thead><tr><th>Criterion</th><th>Nitrile</th><th>Latex</th><th>Vinyl</th></tr></thead>
<tbody>
<tr><td>Chemical resistance</td><td>Excellent</td><td>Good (water-based)</td><td>Weak</td></tr>
<tr><td>Puncture resistance</td><td>Excellent</td><td>Moderate</td><td>Low</td></tr>
<tr><td>Dexterity</td><td>Good</td><td>Excellent</td><td>Poor</td></tr>
<tr><td>Allergen risk</td><td>None</td><td>High (type I)</td><td>None</td></tr>
<tr><td>Relative cost</td><td>Mid</td><td>Low–mid</td><td>Lowest</td></tr>
<tr><td>Best for</td><td>Medical, labs, industrial</td><td>Surgical</td><td>Food, light cleaning</td></tr>
</tbody>
</table>

<h2>Rules every Kenyan buyer should follow</h2>
<ul>
<li>Gloves for medical use must carry appropriate certification — look for KEBS approval and EN 455 (medical) or EN 374 (chemical) marks.</li>
<li>Never reuse single-use examination gloves between patients or tasks.</li>
<li>Store gloves away from heat, sunlight and chemicals — latex degrades quickly.</li>
<li>Buy powdered-free for clinical areas to reduce contamination and skin irritation.</li>
<li>If your team handles both food and chemicals, separate the glove types — don't compromise.</li>
</ul>
<p>KimSafety stocks <a href="/search">certified gloves for every task</a> — from surgical latex to industrial nitrile — and can advise on volume pricing for clinics and factories.</p>
`,
  },
  {
    slug: "workplace-hazard-assessment-guide",
    title: "How to Conduct a Workplace Hazard Assessment: A Step-by-Step Guide",
    category: "Safety Management",
    excerpt:
      "A practical, repeatable method for identifying, assessing and controlling hazards in Kenyan workplaces — with the hierarchy of controls, documentation templates and how to turn findings into a PPE plan.",
    read_time: "10 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/Construction Helmets.jpg",
    created_at: day(24),
    content: `
<p>Every injury on a worksite can be traced back to a hazard that was never identified — or was identified and ignored. A proper hazard assessment is the single highest-leverage activity an employer can run. It is also required by Kenya's OSH Act 2007 and expected by DOSHS inspectors.</p>

<h2>What the law expects</h2>
<p>Section 6 of the OSH Act obliges employers to ensure a safe working environment. In practice, DOSHS expects you to show a documented risk assessment process. The goal is not paperwork for its own sake: it is a written record that you identified hazards, assessed their severity and implemented controls.</p>

<h2>Step 1: Walk the work, not just the building</h2>
<p>Conduct assessments where work actually happens — at dawn for night shifts, during peak production, in the rain. Watch tasks being performed, interview workers and photograph problem areas. Workers will show you hazards you would never find from an office.</p>

<h2>Step 2: Classify the hazards</h2>
<p>Group what you find into standard categories:</p>
<ul>
<li><strong>Physical:</strong> noise, vibration, temperature extremes, radiation, moving machinery.</li>
<li><strong>Chemical:</strong> solvents, dusts, fumes, gases, corrosives.</li>
<li><strong>Biological:</strong> blood-borne pathogens, waste, infectious materials.</li>
<li><strong>Ergonomic:</strong> manual handling, repetitive motion, poor workstations.</li>
<li><strong>Psychosocial:</strong> stress, fatigue, violence, lone working.</li>
</ul>

<h2>Step 3: Rate risk = likelihood × severity</h2>
<p>Use a simple 5×5 matrix. Score each hazard for likelihood (1 = rare, 5 = almost certain) and severity (1 = first aid, 5 = fatality). Multiply for a risk score:</p>
<ul>
<li><strong>1–4:</strong> low — monitor and maintain controls.</li>
<li><strong>5–9:</strong> medium — schedule corrective action.</li>
<li><strong>10–15:</strong> high — act quickly; interim controls now.</li>
<li><strong>16–25:</strong> critical — stop work until controlled.</li>
</ul>

<h2>Step 4: Apply the hierarchy of controls</h2>
<p>Never jump straight to PPE. Work down this list in order:</p>
<ol>
<li><strong>Elimination</strong> — remove the hazard entirely (e.g. ban a hazardous process).</li>
<li><strong>Substitution</strong> — replace with something safer (water-based solvent instead of volatile).</li>
<li><strong>Engineering controls</strong> — guards, ventilation, machine isolation.</li>
<li><strong>Administrative controls</strong> — rotas, training, permits-to-work, signage.</li>
<li><strong>PPE</strong> — the last line of defence, not the first.</li>
</ol>
<p>When PPE is required, select it from certified stock and train workers on fit and use. Our <a href="/knowledge/ppe-selection-by-industry">PPE selection matrix</a> maps each hazard to the right equipment.</p>

<h2>Step 5: Document and communicate</h2>
<p>A one-page register per department is enough to start. For each hazard record: description, location, risk score, control measures, responsible person and review date. Share findings at toolbox talks and keep the register where workers can see it.</p>

<h2>Step 6: Review on a schedule — and after every incident</h2>
<p>Review at least annually, whenever processes change, after near-misses and after every injury. A stale risk assessment is itself a hazard.</p>

<h2>Turning findings into action</h2>
<p>Where your assessment identifies PPE needs, <a href="/search">browse the certified range</a> and <a href="/quote">request bulk pricing</a> — with proper documentation for your audit trail.</p>
`,
  },
  {
    slug: "fall-protection-at-height-guide",
    title: "Fall Protection at Height: Harnesses, Lanyards and Anchor Points Explained",
    category: "Construction Safety",
    excerpt:
      "Falls are the leading cause of death on Kenyan construction sites. Here is what full-body harnesses, lanyards, anchor points and rescue plans actually require — with inspection and selection guidance.",
    read_time: "11 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/Double Hook Work Man Full Body Safety Harness.jpg",
    created_at: day(31),
    content: `
<p>Falls from height remain the number one cause of fatal workplace accidents in Kenya's construction industry. The good news: falls are almost entirely preventable with correctly selected, correctly used and correctly inspected fall protection systems. This article covers the essentials every site manager and safety officer needs.</p>

<h2>The three elements of a fall arrest system</h2>
<p>A complete system has three parts — and all three must be compatible:</p>
<ul>
<li><strong>Anchorage</strong> — the point the system attaches to (beam, anchor post, certified lifeline).</li>
<li><strong>Connecting means</strong> — lanyard, shock absorber or retractable lifeline.</li>
<li><strong>Body support</strong> — a full-body harness, never a body belt.</li>
</ul>

<h2>Full-body harnesses: the non-negotiable</h2>
<p>Body belts are banned in modern fall arrest for good reason: in a fall, they concentrate force on the abdomen and can cause fatal internal injuries. A full-body harness distributes the force across the thighs, chest and shoulders.</p>
<p>When selecting harnesses, look for:</p>
<ul>
<li>Compliance with <strong>EN 361</strong> (fall arrest harness) — the standard to demand.</li>
<li>Quick-release buckles that stay adjusted once set.</li>
<li>Load-tested D-rings with clear markings.</li>
<li>Lightweight webbing for hot Kenyan sites — 3M and MSA designs balance comfort and safety.</li>
</ul>
<p>Popular choices include the <a href="/product/KS-PPE-3004">double-hook harness with shock absorber</a> — the double hooks allow constant connection when moving between anchors.</p>

<h2>Lanyards and shock absorbers</h2>
<p>A lanyard alone can generate forces above 6 kN in a fall — enough to injure or break anchors. Always use a <strong>shock-absorbing lanyard</strong> to keep forces below 6 kN, or a retractable lifeline (inertia reel) which limits both force and fall distance.</p>
<p>Remember the free-fall rule: the lanyard must be attached so that free fall does not exceed <strong>1.8 metres</strong>, and the total clearance below the worker must accommodate the deployed lanyard, harness stretch and safety margin.</p>

<h2>Anchor points: strong enough for 15 kN</h2>
<p>Fall arrest anchors are typically rated to hold <strong>at least 15 kN</strong> (more than 1.5 tonnes) — one anchor per worker. Never tie off to scaffolds, pipes or guardrails unless they have been engineered as anchors. For multi-worker work, use certified horizontal lifelines.</p>

<h2>The 12-point site checklist</h2>
<p>Our full <a href="/knowledge/working-at-height-checklist">working at height checklist</a> covers every item; the essentials are:</p>
<ol>
<li>Anchorage rated and inspected for this shift.</li>
<li>Harness webbing free of cuts, fraying, burns or chemical damage.</li>
<li>All stitching intact — no loose or pulled threads.</li>
<li>Buckles, D-rings and adjusters function correctly.</li>
<li>Lanyard shock absorber pack not deployed (or replaced if it is).</li>
<li>Lifelines routed to minimise swing and rubbing.</li>
<li>Free fall distance within limits.</li>
<li>Worker trained and competent on this system.</li>
<li>Edge protection in place where practicable.</li>
<li>Tools secured to prevent dropped-object hazards.</li>
<li>Rescue plan exists for a fallen worker — never leave a worker hanging.</li>
<li>Inspection records up to date (professional inspection every 6–12 months).</li>
</ol>

<h2>Rescue: the plan people forget</h2>
<p>Suspension trauma can kill a worker within 30 minutes of hanging motionless. Every site with fall risk needs a documented rescue procedure — and someone trained to execute it.</p>

<h2>Buying fall protection in Kenya</h2>
<p>Only purchase harnesses, lanyards and lifelines from authorised suppliers who can provide EN/CE certification documentation per batch. Browse <a href="/search?category=construction-safety">certified construction safety equipment</a> and <a href="/quote">request volume pricing</a> for full site outfitting.</p>
`,
  },
  {
    slug: "kenya-osh-act-2007-compliance-checklist",
    title: "OSHA Act 2007 Kenya: The Employer's Compliance Checklist",
    category: "Regulations",
    excerpt:
      "A plain-English walkthrough of Kenya's Occupational Safety and Health Act 2007 — duties of employers, safety committees, reporting obligations, penalties and how to prove compliance to DOSHS inspectors.",
    read_time: "9 min read",
    author: "KimSafety HSE Team",
    cover: "/images/hero/hero4.jpg",
    created_at: day(38),
    content: `
<p>The <strong>Occupational Safety and Health Act, 2007</strong> (No. 15 of 2007) is the primary workplace safety law in Kenya. Administered by the Directorate of Occupational Safety and Health Services (DOSHS), it applies to virtually every workplace — offices, factories, farms, hospitals, schools and construction sites. Here is what it demands of you, in plain English.</p>

<h2>The core duty (Section 6)</h2>
<p>Every employer must "ensure the safety, health and welfare at work of all persons working in the undertaking". Concretely that means:</p>
<ul>
<li>Providing and maintaining safe plant and systems of work.</li>
<li>Controlling the use, handling and storage of dangerous substances.</li>
<li>Providing <strong>free PPE</strong> and ensuring it is used.</li>
<li>Providing information, instruction, training and supervision.</li>
<li>Maintaining a safe working environment with adequate amenities.</li>
</ul>

<h2>Workplace assessment and registration (Sections 20–24)</h2>
<p>Workplaces with <strong>20 or more employees</strong> must be registered with DOSHS and the premises assessed for safety and health conditions. Annual re-registration and updated assessments are expected — many sites only discover this during an inspection or tender audit.</p>

<h2>Safety committees (Section 38)</h2>
<p>Workplaces with more than 20 employees must establish a <strong>safety and health committee</strong> with employer and employee representatives. The committee should meet regularly, inspect the workplace and review accident reports. Keep signed minutes — inspectors ask for them.</p>

<h2>First aid, fire and emergency preparedness</h2>
<p>The law and its subsidiary regulations require:</p>
<ul>
<li>First aid boxes stocked per the approved contents list, with trained first aiders on each shift.</li>
<li>Fire prevention equipment — extinguishers, alarms and escape routes — maintained and tested.</li>
<li>Fire drills and evacuation procedures documented and rehearsed.</li>
<li>Written emergency procedures displayed where workers can see them.</li>
</ul>

<h2>Accident and dangerous occurrence reporting</h2>
<p>Report <strong>fatalities and serious injuries to DOSHS within 24 hours</strong>, and maintain a register of all accidents. Failure to report is itself an offence. Accurate registers also matter for the Work Injury Benefits Act claims process.</p>

<h2>Penalties for non-compliance</h2>
<p>Fines under the OSH Act can reach <strong>KES 1 million</strong> for repeat or serious offences, with possible imprisonment for individuals. Beyond fines: stop-work orders, liability in injury compensation claims, insurance premium increases and disqualification from government tenders — which for many Kenyan organisations is the most expensive consequence of all.</p>

<h2>Your quick compliance checklist</h2>
<ul>
<li>Workplace registered with DOSHS (if 20+ employees).</li>
<li>Risk assessments conducted and documented.</li>
<li>Safety committee active, with minutes.</li>
<li>First aid kits stocked and inspected monthly.</li>
<li>Fire extinguishers inspected monthly, serviced annually.</li>
<li>PPE provided free, certified and size-appropriate.</li>
<li>Accident register maintained; serious incidents reported within 24 hours.</li>
<li>Worker training recorded.</li>
<li>Medical examination arrangements for hazardous work.</li>
</ul>

<h2>Where to get help</h2>
<p>Equip yourself from <a href="/search">certified safety supplies</a> — first aid kits, fire extinguishers and PPE — and let our team support your <a href="/quote">bulk procurement</a> with tender-ready documentation. Our <a href="/knowledge/kenya-occupational-safety-laws">OSH Act guide</a> goes deeper into the legal detail.</p>
`,
  },
  {
    slug: "how-to-choose-safety-helmet",
    title: "How to Choose a Safety Helmet in Kenya: Standards, Classes and Fit",
    category: "Buying Guide",
    excerpt:
      "EN 397 vs ANSI Type I and II, shell materials, suspension systems, expiry rules and the inspection points that DOSHS and site inspectors check on helmets.",
    read_time: "7 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/Construction Helmets.jpg",
    created_at: day(45),
    content: `
<p>Safety helmets save lives on Kenyan construction sites every day — and counterfeit or expired helmets claim them. Choosing a helmet is a 15-minute decision with a decade-long consequence. Here is how to do it properly.</p>

<h2>Step 1: Check the standard</h2>
<p>Demand helmets tested to a recognised standard:</p>
<ul>
<li><strong>EN 397</strong> — the European industrial helmet standard: impact, penetration, flame resistance and electrical performance.</li>
<li><strong>ANSI/ISEA Z89.1 Type I</strong> — protects against vertical impact only.</li>
<li><strong>ANSI Z89.1 Type II</strong> — adds lateral (side) impact protection.</li>
</ul>
<p>The standard mark should be moulded into the shell or printed on a permanent label. No mark? No purchase. The <a href="/product/KS-IND-2001">3M Vanguard helmet</a> and other major brands print their certification directly on the shell.</p>

<h2>Step 2: Choose the right shell material</h2>
<ul>
<li><strong>HDPE (high-density polyethylene)</strong> — the affordable workhorse; tough, UV-resistant, good for most sites.</li>
<li><strong>ABS</strong> — strong, with better resistance to chemicals and solvents; slightly heavier.</li>
<li><strong>Fibreglass composite</strong> — best electrical insulation and heat resistance; used for electrical and foundry work.</li>
<li><strong>Polycarbonate</strong> — lightweight and impact-resistant; premium option.</li>
</ul>

<h2>Step 3: Understand suspension and classes</h2>
<p>The suspension (the cradle inside) absorbs impact energy — it is as important as the shell. Check for:</p>
<ul>
<li>Adjustable headband with a clear size range (typically 52–62 cm).</li>
<li>Easy-height adjustment (pin-lock or ratchet).</li>
<li>Chin strap option for tasks with leaning or inverted work.</li>
<li>Ventilation for Kenyan heat, without compromising the standard.</li>
</ul>
<p>For electrical work, choose helmets tested to the relevant electrical class. Add accessories when needed: face shields, ear muffs and helmet-mounted lamp brackets must be approved for the helmet model.</p>

<h2>Step 4: Fit it correctly</h2>
<p>Fit determines protection:</p>
<ul>
<li>The helmet should sit level, roughly one finger-width above the eyebrows.</li>
<li>It should not move when you shake your head.</li>
<li>The chin strap, where fitted, must be snug.</li>
<li>Wear it at all times in the designated area — not on the back of the head or the passenger seat.</li>
</ul>

<h2>Expiry and replacement rules</h2>
<p>Helmets have a service life — usually <strong>2–5 years from manufacture</strong> depending on material and exposure. Replace immediately after:</p>
<ul>
<li>Any significant impact (even if no crack is visible).</li>
<li>Visible cracks, dents, or deep scratches.</li>
<li>UV discolouration or chalky texture.</li>
<li>Chemical or paint damage.</li>
<li>Deteriorated suspension (torn cradle, cracked adjuster).</li>
</ul>
<p>Never paint, drill or solvent-clean a helmet shell — this voids its certification.</p>

<h2>Buying tips for Kenyan buyers</h2>
<ul>
<li>Buy branded helmets from authorised stockists with certification documents per batch.</li>
<li>Store helmets out of direct sunlight between shifts.</li>
<li>Keep one spare per 10 helmets for visitors and replacements.</li>
<li>Record batch numbers for traceability in audits.</li>
</ul>
<p>Browse certified <a href="/search?category=industrial-safety">industrial safety helmets</a> from 3M, MSA, Karam and Delta Plus, or <a href="/quote">request site-wide pricing</a>.</p>
`,
  },
  {
    slug: "workplace-first-aid-kit-guide",
    title: "Workplace First Aid Kits in Kenya: Legal Requirements and Contents",
    category: "Emergency Response",
    excerpt:
      "What the Kenyan workplace first aid regulations require, the contents list to stock, how many kits your premises needs and why refills are a compliance issue, not a convenience.",
    read_time: "8 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/Medium Grey First Aid Kit.jpg",
    created_at: day(52),
    content: `
<p>Every Kenyan workplace must provide first aid facilities — it is a direct legal requirement, not a suggestion. Yet most first aid boxes we see on site are either empty, expired or stocked with items that do not match the risks of the workplace. This guide fixes that.</p>

<h2>What the law requires</h2>
<p>Kenya's OSH Act 2007 and the accompanying First Aid Regulations require employers to provide:</p>
<ul>
<li>First aid boxes containing the specified contents, maintained and accessible.</li>
<li>A person trained in first aid (the number scales with workforce size and shift patterns).</li>
<li>Where risk demands it, a first aid room — for example on larger industrial sites.</li>
<li>Records of first aid treatments given.</li>
</ul>
<p>DOSHS inspectors routinely check first aid provision, and it is frequently among the first items noted on non-compliance reports.</p>

<h2>How many kits do you need?</h2>
<p>As a practical rule:</p>
<ul>
<li>One kit per <strong>25 workers</strong> per site.</li>
<li>One kit per floor in multi-storey buildings.</li>
<li>Additional kits near high-risk areas: kitchens, workshops, laboratories, electrical rooms.</li>
<li>A kit in every vehicle that transports employees or goods.</li>
</ul>

<h2>The essential contents list</h2>
<p>Use this as the baseline for a general workplace kit:</p>
<ul>
<li>Sterile gauze dressings — multiple sizes (5×5 cm, 10×10 cm).</li>
<li>Adhesive plasters, assorted sizes (hypoallergenic).</li>
<li>Triangular bandages (at least 2).</li>
<li>Roller bandages — crepe and conforming (5 cm and 10 cm).</li>
<li>Scissors, tweezers, safety pins.</li>
<li>Disposable examination gloves (nitrile preferred).</li>
<li>Adhesive tape and a tape roll.</li>
<li>Antiseptic wipes or solution.</li>
<li>Eye wash — at least 500 ml sterile solution per station.</li>
<li>Burn dressing or hydrogel.</li>
<li>Resuscitation face shield.</li>
<li>First aid guide card.</li>
<li>Record book and pen.</li>
</ul>
<p>We stock complete <a href="/search?category=emergency-response">certified first aid kits</a> from compact wall kits to <a href="/product/KS-PPE-3003">25-piece rescue boxes</a> for larger teams.</p>

<h2>Industry-specific additions</h2>
<ul>
<li><strong>Kitchens & hotels:</strong> burn dressings, extra eye wash.</li>
<li><strong>Factories & workshops:</strong> trauma dressings, tourniquets, large burn kits.</li>
<li><strong>Laboratories:</strong> chemical eye wash stations, neutralising solutions.</li>
<li><strong>Construction:</strong> trauma kits, cold packs, finger splints.</li>
<li><strong>Healthcare:</strong> clinical-grade consumables in larger volumes.</li>
</ul>

<h2>Maintenance: refills are compliance</h2>
<p>An empty box is the same as no box. Build a monthly routine:</p>
<ul>
<li>Check expiry dates on every item — dressings and antiseptics degrade.</li>
<li>Replace used items immediately — log usage in the treatment book.</li>
<li>Top up monthly; restock completely after any incident.</li>
<li>Assign a named custodian per kit.</li>
<li>Keep kits in dry, visible, accessible locations — away from heat.</li>
</ul>
<p>Stock and <a href="/quote">refill supplies</a> (including glove boxes and dressings in bulk) are available from our emergency response range.</p>

<h2>Training matters more than the box</h2>
<p>Equipment without trained people is decoration. Ensure a certified first aider is on site for every shift, and run a refresher at least annually. If you are setting up a first aid programme from scratch, pair your kit purchase with first aid training for your team.</p>
`,
  },
  {
    slug: "spotting-counterfeit-ppe-kenya",
    title: "How to Spot Counterfeit PPE in Kenya (and Why It Matters)",
    category: "Safety Standards",
    excerpt:
      "Counterfeit helmets, gloves and respirators kill. Learn the tell-tale signs of fake PPE, the certification documents to demand and how to buy only from authorised channels in Kenya.",
    read_time: "9 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/PROTECTA CHEMICAL SAFETY GOGGLES.jpg",
    created_at: day(59),
    content: `
<p>Counterfeit PPE is a silent epidemic in Kenyan markets. Fake 3M respirators, unbranded "EN 397" helmets and re-labelled gloves appear in hardware shops and online marketplaces daily. The worst part: these products do not merely fail to protect — they actively create a false sense of safety. A worker who believes he is protected is more exposed than one who knows he is not.</p>

<h2>Why counterfeit PPE is so dangerous</h2>
<ul>
<li>Fake respirators fail seal tests and filter tests — toxic dust and fumes pass straight through.</li>
<li>Counterfeit helmets crack on impact because the shell is recycled, brittle plastic.</li>
<li>Fake gloves dissolve or tear on contact with chemicals.</li>
<li>False certification marks create legal exposure for the employer who purchased them.</li>
</ul>
<p>When counterfeit PPE fails, the liability does not fall on the vendor — it falls on the employer who supplied it.</p>

<h2>The tell-tale signs of fake PPE</h2>
<h3>1. The price is too good</h3>
<p>A genuine 3M half-mask respirator costs what it costs because of the engineering inside it. A helmet at a third of the authorised price is not a deal — it is a hazard with a price tag. Remember the rule: <em>if the price seems too good to be true, the product almost certainly is.</em></p>

<h3>2. The markings are missing or suspicious</h3>
<ul>
<li>Genuine products carry permanently printed standard marks (EN 397, EN 388, CE with a notified body number).</li>
<li>Check for holograms, batch codes and model-specific markings.</li>
<li>Compare the font, spacing and logo against authorised product photos from the manufacturer's site.</li>
</ul>

<h3>3. Packaging and documentation feel wrong</h3>
<ul>
<li>Blurred printing, colour shifts and poor-quality labels are classic fakes.</li>
<li>Genuine brands include user instructions, batch traceability and often a certificate.</li>
<li>Ask for the <strong>certificate of conformance</strong> for the specific batch — an authorised stockist can provide it within minutes.</li>
</ul>

<h3>4. Weight and finish are off</h3>
<p>Hold the item. A genuine helmet shell is uniformly finished with clean moulding marks. Fakes often show rough edges, uneven texture, misaligned straps or buckles that jam. Compare two units side by side — inconsistencies scream counterfeiting.</p>

<h2>What documents to demand</h2>
<ul>
<li>Invoice from an authorised distributor.</li>
<li>Certificate of conformance or test report for the batch (EN/CE/ANSI/KEBS).</li>
<li>Manufacturer's datasheet matching the product you received.</li>
<li>Batch numbers that trace to the distributor's stock records.</li>
</ul>
<p>If a supplier hesitates on any of these, walk away.</p>

<h2>How KimSafety guarantees authenticity</h2>
<p>KimSafety sources only through authorised distribution channels for brands like 3M, Honeywell, Ansell, Uvex, MSA, DuPont and Karam. Every batch is quality-inspected before dispatch, certification documentation is kept on file, and counterfeits discovered in our network are destroyed — not resold.</p>

<h2>Buy safe, buy certified</h2>
<p>Buy your PPE from the <a href="/search">certified KimSafety range</a>, and for organisational purchases insist on <a href="/quote">documented quotations</a> that include certification files. A few extra shillings on a genuine product is the cheapest insurance your workforce will ever have.</p>
`,
  },
  {
    slug: "respiratory-protection-kenya-guide",
    title: "Respiratory Protection in Kenya: Masks, Respirators and Fit Testing",
    category: "PPE",
    excerpt:
      "From 3-ply face masks to half-mask respirators with chemical cartridges — the hierarchy of respiratory protection, filter classes, fit testing and when each level is actually required in Kenyan workplaces.",
    read_time: "10 min read",
    author: "KimSafety HSE Team",
    cover: "/images/products/Double Respirator Mask (NP306).jpg",
    created_at: day(66),
    content: `
<p>Dust, fumes, gases and pathogens — Kenyan workers inhale hazards on construction sites, in factories, laboratories and clinics. Respiratory protection is one of the most technical areas of PPE, and the most common to get wrong. Here is a practical framework.</p>

<h2>First: can the hazard be removed?</h2>
<p>Respirators are the last line of defence. Before buying masks, apply the hierarchy of controls: eliminate the dust source, substitute safer materials, install local exhaust ventilation. Respiratory protection should protect what ventilation cannot reach — not replace ventilation that should exist.</p>

<h2>The three levels of protection</h2>
<h3>Level 1: Filtering facepieces (disposable masks)</h3>
<p>These are single-use filtering masks, not hospital procedure masks:</p>
<ul>
<li><strong>FFP1:</strong> filters at least 80% of airborne particles — nuisance dust only.</li>
<li><strong>FFP2:</strong> filters at least 94% — construction dust, concrete, wood, influenza-level protection.</li>
<li><strong>FFP3:</strong> filters at least 99% — fine toxic dusts, some biohazards.</li>
</ul>
<p>For most Kenyan construction and general dust environments, FFP2 is the practical minimum. In healthcare, the 3-ply <a href="/product/KS-MED-1002">surgical masks</a> protect patients and staff from droplets, while FFP2/3 respirators are used for aerosol-generating procedures.</p>

<h3>Level 2: Half-mask respirators with replaceable cartridges</h3>
<p>Reusable half masks with filters for gases, vapours and particles. Choose filters by hazard:</p>
<ul>
<li><strong>P1/P2/P3 particulate filters</strong> — dust, mists and fibres (P3 for asbestos and toxic dusts).</li>
<li><strong>A filters (brown)</strong> — organic vapours: solvents, paints, thinners.</li>
<li><strong>B filters (grey)</strong> — acid gases: chlorine, hydrogen chloride.</li>
<li><strong>E filters (yellow)</strong> — sulphur dioxide and acid gases.</li>
<li><strong>K filters (green)</strong> — ammonia.</li>
<li><strong>Combination filters</strong> — A2P3 style for mixed hazards (e.g. spray painting).</li>
</ul>
<p>The <a href="/product/KS-PPE-3001">3M half-mask respirators</a> we stock cover most industrial needs, and we advise on cartridge selection per site.</p>

<h3>Level 3: Full-face respirators and powered systems</h3>
<p>When hazards irritate the eyes or concentrations are high — welding fumes, chemical spill response, confined spaces — upgrade to full-face respirators or powered air-purifying respirators (PAPR). Confined space entry requires a positive-pressure breathing apparatus, full stop.</p>

<h2>Fit testing is not optional</h2>
<p>A respirator that leaks protects nobody. Fit testing should be performed by a trained person using either qualitative or quantitative methods, and repeated when the wearer's face shape changes (weight change, facial hair, dental work) or when a new model is introduced. Key rules:</p>
<ul>
<li>No facial hair in the sealing area.</li>
<li>Donning must follow the manufacturer's sequence.</li>
<li>Negative and positive pressure seal checks before each use.</li>
</ul>

<h2>Filter life and maintenance</h2>
<ul>
<li>Replace particulate filters when breathing resistance increases or per schedule.</li>
<li>Gas/vapour cartridges must be replaced on a set schedule — they do not warn you.</li>
<li>Clean half masks after use; never clean filters.</li>
<li>Store respirators sealed away from dust and chemicals.</li>
<li>Never share respirators without sanitation.</li>
</ul>

<h2>Documentation for your safety file</h2>
<p>DOSHS inspectors and auditors look for: hazard assessment, respirator selection rationale, fit test records, training records and filter replacement logs. Keep them with your other PPE records — our <a href="/quote">corporate procurement</a> team can help you build the standard set of documents.</p>

<h2>Start with an assessment</h2>
<p>Book a consult or browse the <a href="/search?category=ppe">certified respiratory range</a> — and if your team is large, <a href="/quote">ask for bulk pricing</a> with training support.</p>
`,
  },
];

const insert = db.prepare(
  "INSERT OR REPLACE INTO posts (id, slug, title, category, excerpt, content, cover, author, read_time, published, created_at, updated_at) VALUES (@id, @slug, @title, @category, @excerpt, @content, @cover, @author, @read_time, @published, @created_at, @updated_at)"
);

const tx = db.transaction(() => {
  for (const p of posts) {
    insert.run({
      id: randomUUID(),
      slug: p.slug,
      title: p.title,
      category: p.category,
      excerpt: p.excerpt,
      content: p.content.trim(),
      cover: p.cover,
      author: p.author,
      read_time: p.read_time,
      published: 1,
      created_at: p.created_at,
      updated_at: now,
    });
  }
});

tx();
console.log(`Seeded ${posts.length} blog posts into ${DB_PATH}`);
