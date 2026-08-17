import { StreamCategoryCode } from "@/shared/constants/streams";
import { HomeFacts } from "@/shared/types/home";
import { RecordDocType } from "@/shared/utils/recordNaming";

/**
 * A worked example of the five-section architecture: one established home with
 * an original build, a kitchen remodel, routine service, and a storm that cuts
 * across four sections at once.
 *
 * Every record here is synthetic demo content. `scripts/generateExampleFiles.ts`
 * renders these into real PDFs named by the convention, so the demo can be
 * driven with files that look like the ones a homeowner would actually upload.
 */

export const EXAMPLE_PROPERTY: HomeFacts = {
  address: "4412 Maple Ridge Drive",
  city: "Austin",
  state: "TX",
  zip: "78704",
  beds: 4,
  baths: 3,
  sqft: 2640,
  lotSqft: 8712,
  yearBuilt: 1998,
  propertyType: "Single Family",
};

export interface ExampleRecord {
  /** Which of the five sections the document is filed under. */
  stream: StreamCategoryCode;
  /** ISO date the document is *about*. */
  date: string;
  type: RecordDocType;
  reason: string;
  docName: string;
  extension: string;
  /** Lines rendered into the generated PDF body. */
  body: string[];
  /**
   * Optional link to a property event.
   *
   * This is Option 1 from the architecture doc in miniature: the storm records
   * below stay filed in their own sections — the roof invoice under Maintenance,
   * the permit under Property Records, the warranty under Systems, the claim
   * under the Personal Vault — and the event string is what draws them into one
   * chronological view. Nothing is duplicated to achieve it.
   */
  event?: string;
}

export const STORM_EVENT = "Storm Damage – May 2026";
const KITCHEN_EVENT = "Kitchen Remodel – 2024";

export const EXAMPLE_RECORDS: ExampleRecord[] = [
  // ---- Home Profile -------------------------------------------------------
  {
    stream: "home-profile",
    date: "1998-04-16",
    type: "Plan",
    reason: "Original Construction",
    docName: "Sheet A-101 floor plan",
    extension: "pdf",
    body: [
      "Sheet A-101 — Ground Floor Plan",
      "Architect: Brennan & Wills Residential",
      "Scale: 1/4in = 1ft",
      "Conditioned area: 2,640 sq ft",
      "Foundation: post-tensioned slab on grade",
    ],
  },
  {
    stream: "home-profile",
    date: "1998-06-02",
    type: "Spec",
    reason: "Original Construction",
    docName: "Interior paint schedule",
    extension: "pdf",
    body: [
      "Interior finish schedule",
      "Walls (living, hall): Sherwin-Williams SW 7036 Accessible Beige, eggshell",
      "Trim and doors: SW 7005 Pure White, semi-gloss",
      "Ceilings: SW 7005 Pure White, flat",
      "Primary bedroom: SW 6204 Sea Salt, eggshell",
    ],
  },
  {
    stream: "home-profile",
    date: "1998-09-11",
    type: "Certificate",
    reason: "Original Construction",
    docName: "Certificate of Occupancy",
    extension: "pdf",
    body: [
      "CERTIFICATE OF OCCUPANCY",
      "Issuing authority: City of Austin, Development Services",
      "Permit reference: BP-1998-041872",
      "Use group: R-3 single family residential",
      "Final inspection passed: 11 September 1998",
    ],
  },
  {
    stream: "home-profile",
    date: "1998-03-30",
    type: "Survey",
    reason: "Original Construction",
    docName: "Boundary survey",
    extension: "pdf",
    body: [
      "Boundary and improvement survey",
      "Surveyor: Colorado River Land Surveying, RPLS #5512",
      "Lot 14, Block C, Maple Ridge Section Two",
      "Lot area: 8,712 sq ft (0.20 acres)",
      "Front building setback: 25 ft; side: 5 ft",
    ],
  },

  // ---- Maintenance & Upgrades --------------------------------------------
  {
    stream: "maintenance-upgrades",
    date: "2024-02-19",
    type: "Estimate",
    reason: "Kitchen Remodel",
    docName: "Hill Country Kitchens estimate",
    extension: "pdf",
    body: [
      "Scope: full kitchen renovation, cabinetry, counters, appliances",
      "Demolition and haul-away .................... $ 3,400.00",
      "Cabinetry (shaker, painted maple) ........... $ 18,750.00",
      "Quartz countertops, 62 sq ft ................ $ 6,820.00",
      "Electrical and plumbing rough-in ............ $ 4,900.00",
      "Labour and finish carpentry ................. $ 9,200.00",
      "Estimate total .............................. $ 43,070.00",
      "Valid 30 days. Licence TX-RC-88214.",
    ],
    event: KITCHEN_EVENT,
  },
  {
    stream: "maintenance-upgrades",
    date: "2024-06-28",
    type: "Invoice",
    reason: "Kitchen Remodel",
    docName: "Hill Country Kitchens final invoice",
    extension: "pdf",
    body: [
      "Invoice 2024-0618 — final, project complete",
      "Contracted scope ............................ $ 43,070.00",
      "Change order 1 (under-cabinet lighting) ..... $ 1,240.00",
      "Change order 2 (pot filler rough-in) ........ $   860.00",
      "Subtotal .................................... $ 45,170.00",
      "Deposit received 19 Feb 2024 ................ ($ 15,000.00)",
      "Balance due ................................. $ 30,170.00",
      "Workmanship warranty: 2 years from completion.",
    ],
    event: KITCHEN_EVENT,
  },
  {
    stream: "maintenance-upgrades",
    date: "2024-03-04",
    type: "Photo",
    reason: "Kitchen Remodel",
    docName: "Before demolition",
    extension: "pdf",
    body: [
      "Condition photographs — pre-demolition",
      "Original 1998 oak cabinetry and laminate counters",
      "Vinyl flooring, single-basin sink, no island",
      "Photographed 4 March 2024, prior to any work",
    ],
    event: KITCHEN_EVENT,
  },
  {
    stream: "maintenance-upgrades",
    date: "2024-06-26",
    type: "Photo",
    reason: "Kitchen Remodel",
    docName: "After completion",
    extension: "pdf",
    body: [
      "Condition photographs — post-completion",
      "Painted maple shaker cabinetry, quartz counters",
      "New island with seating for three",
      "Photographed 26 June 2024, at final walkthrough",
    ],
    event: KITCHEN_EVENT,
  },
  {
    stream: "maintenance-upgrades",
    date: "2025-10-07",
    type: "Receipt",
    reason: "New Carpeting",
    docName: "HOME DEPOT carpeting",
    extension: "pdf",
    body: [
      "THE HOME DEPOT #6521 — Austin S Lamar",
      "Lifeproof Barnhart carpet, 62.5 sq yd ....... $ 1,743.75",
      "8 lb rebond pad, 62.5 sq yd ................. $   331.25",
      "Installation, 3 bedrooms + hall ............. $   890.00",
      "Subtotal .................................... $ 2,965.00",
      "Sales tax 8.25% ............................. $   244.61",
      "Total ....................................... $ 3,209.61",
      "Paid by card ending 4471.",
    ],
  },
  {
    stream: "maintenance-upgrades",
    date: "2026-03-12",
    type: "Report",
    reason: "Annual HVAC Service",
    docName: "Lone Star Air service report",
    extension: "pdf",
    body: [
      "Annual preventative maintenance — cooling season",
      "Unit: Trane XR14, installed 2019, serial 19143K8821",
      "Refrigerant charge: within spec",
      "Condenser coil cleaned; capacitor tested at 44.8 uF (rated 45)",
      "Blower wheel cleaned, filter replaced (20x25x1 MERV 11)",
      "Result: PASS. Next service due March 2027.",
      "Technician: R. Alvarez, TACLB #44219E",
    ],
  },
  {
    stream: "maintenance-upgrades",
    date: "2026-05-30",
    type: "Invoice",
    reason: "Roof Replacement",
    docName: "Summit Roofing invoice",
    extension: "pdf",
    body: [
      "Invoice 5512 — full tear-off and replacement",
      "Cause: hail and falling limb damage, storm of 14 May 2026",
      "Tear-off and disposal, 28 sq ................ $ 4,200.00",
      "Owens Corning Duration shingles, 28 sq ...... $ 11,760.00",
      "Synthetic underlayment and ice barrier ...... $ 1,540.00",
      "Ridge vent, flashing, pipe boots ............ $ 1,180.00",
      "Total ....................................... $ 18,680.00",
      "Licence TX-RCT-30918. Work completed 30 May 2026.",
    ],
    event: STORM_EVENT,
  },

  // ---- Systems & Warranties ----------------------------------------------
  {
    stream: "systems-warranties",
    date: "2019-07-22",
    type: "Manual",
    reason: "HVAC Installation",
    docName: "Trane XR14 owner manual",
    extension: "pdf",
    body: [
      "Trane XR14 split system air conditioner",
      "Model: 4TTR4042L1000AA   Serial: 19143K8821",
      "Nominal capacity: 3.5 ton (42,000 BTU/h)",
      "SEER: 14.5   Refrigerant: R-410A",
      "Filter size: 20x25x1. Replace every 90 days.",
      "Installed 22 July 2019 by Lone Star Air.",
    ],
  },
  {
    stream: "systems-warranties",
    date: "2019-07-22",
    type: "Warranty",
    reason: "HVAC Installation",
    docName: "Trane 10-year parts warranty",
    extension: "pdf",
    body: [
      "Registered limited warranty",
      "Covered equipment: Trane XR14, serial 19143K8821",
      "Functional parts: 10 years from installation",
      "Compressor: 10 years from installation",
      "Registration completed 5 August 2019 (within 60-day window)",
      "Expires: 22 July 2029",
      "Transferable to a subsequent owner — see clause 7.",
    ],
  },
  {
    stream: "systems-warranties",
    date: "2022-04-08",
    type: "Spec",
    reason: "Solar Installation",
    docName: "Panel array datasheet",
    extension: "pdf",
    body: [
      "Rooftop photovoltaic array",
      "Modules: 22 x 400 W monocrystalline",
      "System size: 8.8 kW DC",
      "Inverter: Enphase IQ7+ microinverters, one per module",
      "Array orientation: south-southwest, 24 degree pitch",
      "Commissioned 8 April 2022. Interconnection agreement on file.",
    ],
  },
  {
    stream: "systems-warranties",
    date: "2026-05-30",
    type: "Warranty",
    reason: "Roof Replacement",
    docName: "Summit Roofing 25-year warranty",
    extension: "pdf",
    body: [
      "Limited roofing system warranty",
      "Covered: Owens Corning Duration shingle system, full roof",
      "Manufacturer material coverage: 25 years, prorated after year 10",
      "Contractor workmanship coverage: 10 years",
      "Effective 30 May 2026; expires 30 May 2051",
      "Transferable once, within 60 days of a sale.",
    ],
    event: STORM_EVENT,
  },

  // ---- Property Records ---------------------------------------------------
  {
    stream: "property-records",
    date: "2016-08-19",
    type: "Deed",
    reason: "Purchase",
    docName: "Warranty deed",
    extension: "pdf",
    body: [
      "GENERAL WARRANTY DEED",
      "Recorded: Travis County Clerk, instrument 2016118842",
      "Legal description: Lot 14, Block C, Maple Ridge Section Two,",
      "  a subdivision in Travis County, Texas",
      "Recording date: 19 August 2016",
      "Subject to easements and restrictions of record.",
    ],
  },
  {
    stream: "property-records",
    date: "2026-05-21",
    type: "Permit",
    reason: "Roof Replacement",
    docName: "City of Austin permit",
    extension: "pdf",
    body: [
      "RESIDENTIAL BUILDING PERMIT",
      "Permit number: BP-2026-114503",
      "Scope: reroof, full tear-off, 28 squares, like-for-like",
      "Contractor: Summit Roofing, TX-RCT-30918",
      "Issued: 21 May 2026",
      "Final inspection passed: 3 June 2026",
    ],
    event: STORM_EVENT,
  },
  {
    stream: "property-records",
    date: "2026-01-15",
    type: "HOA",
    reason: "Annual Compliance",
    docName: "Maple Ridge HOA covenants",
    extension: "pdf",
    body: [
      "Maple Ridge Homeowners Association",
      "Declaration of covenants, conditions and restrictions",
      "Annual assessment 2026: $ 420.00, paid in full 15 January 2026",
      "Architectural review required for: roofing colour, exterior paint,",
      "  fencing, and any structure over 120 sq ft",
      "Account status: in good standing.",
    ],
  },

  // ---- Personal Vault (private — detached at sale) ------------------------
  {
    stream: "personal-vault",
    date: "2026-01-02",
    type: "Policy",
    reason: "Homeowners Insurance",
    docName: "State Farm HO-3 policy",
    extension: "pdf",
    body: [
      "Homeowners policy — HO-3 special form",
      "Policy number: 78-KH-4412-9",
      "Term: 2 January 2026 to 2 January 2027",
      "Dwelling coverage A ......................... $ 512,000",
      "Personal property coverage C ................ $ 384,000",
      "All-peril deductible ........................ $ 2,500",
      "Wind and hail deductible .................... 2% of coverage A",
      "Annual premium .............................. $ 3,180.00",
    ],
  },
  {
    stream: "personal-vault",
    date: "2026-05-16",
    type: "Claim",
    reason: "Storm Damage",
    docName: "State Farm claim 4412-SD",
    extension: "pdf",
    body: [
      "Property damage claim",
      "Claim number: 78-KH-4412-9-SD01",
      "Date of loss: 14 May 2026",
      "Cause of loss: wind, hail, and falling limb",
      "Adjuster inspection: 22 May 2026",
      "Approved replacement cost ................... $ 18,680.00",
      "Less wind/hail deductible (2%) .............. ($ 10,240.00)",
      "Net claim payment ........................... $ 8,440.00",
    ],
    event: STORM_EVENT,
  },
  {
    stream: "personal-vault",
    date: "2016-08-19",
    type: "Mortgage",
    reason: "Purchase",
    docName: "Closing disclosure",
    extension: "pdf",
    body: [
      "CLOSING DISCLOSURE",
      "Loan term: 30 years, fixed",
      "Purchase price ............................... $ 389,000.00",
      "Loan amount .................................. $ 311,200.00",
      "Interest rate ................................ 3.625%",
      "Monthly principal and interest ............... $ 1,419.42",
      "Cash to close ................................ $ 86,214.37",
      "Closing date: 19 August 2016",
    ],
  },
  {
    stream: "personal-vault",
    date: "2026-04-30",
    type: "Tax",
    reason: "Property Tax",
    docName: "Travis County assessment",
    extension: "pdf",
    body: [
      "Travis Central Appraisal District — notice of appraised value",
      "Property ID: 0442181405",
      "Tax year: 2026",
      "Market value ................................. $ 641,300",
      "Homestead cap adjustment ..................... ($ 42,880)",
      "Assessed value ............................... $ 598,420",
      "Homestead exemption on file: yes",
      "Protest deadline: 15 May 2026",
    ],
  },
];
