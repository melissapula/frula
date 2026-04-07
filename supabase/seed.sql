-- =============================================
-- SEED: MN Checklist Templates
-- Run after schema.sql
-- =============================================

INSERT INTO public.checklist_templates (name, role, property_type, state, items)
VALUES (
  'MN Residential Seller Checklist',
  'seller',
  'residential',
  'MN',
  '[
    {
      "id": "s1",
      "phase": "immediately",
      "title": "Review and sign the Purchase Agreement",
      "description": "Read every line carefully. Pay attention to contingencies, closing date, what personal property conveys, and any seller concessions.",
      "due_offset_days": 1,
      "required": true,
      "guide_key": "purchase_agreement"
    },
    {
      "id": "s2",
      "phase": "immediately",
      "title": "Collect earnest money from buyer",
      "description": "Earnest money should be deposited into escrow at the title company — not handed to you directly. Confirm the amount matches the Purchase Agreement.",
      "due_offset_days": 2,
      "required": true
    },
    {
      "id": "s3",
      "phase": "immediately",
      "title": "Open escrow with a title company",
      "description": "Contact a title company in your county to open an escrow file. They will coordinate the title search, hold funds, and prepare closing documents.",
      "due_offset_days": 2,
      "required": true
    },
    {
      "id": "s4",
      "phase": "immediately",
      "title": "Notify your current mortgage lender",
      "description": "If you have a mortgage, call your lender to notify them of the pending sale and request a payoff statement.",
      "due_offset_days": 3,
      "required": false
    },
    {
      "id": "s5",
      "phase": "disclosure",
      "title": "Complete Seller''s Property Disclosure Statement",
      "description": "Minnesota requires sellers to disclose known material defects. This form must be delivered to the buyer before or at the time of signing the Purchase Agreement.",
      "due_offset_days": 3,
      "required": true,
      "guide_key": "seller_disclosure"
    },
    {
      "id": "s6",
      "phase": "disclosure",
      "title": "Lead paint disclosure (if home pre-1978)",
      "description": "Federal law requires disclosure of known lead paint hazards for homes built before 1978. Buyer must receive the EPA pamphlet.",
      "due_offset_days": 3,
      "required": false
    },
    {
      "id": "s7",
      "phase": "disclosure",
      "title": "Well and Septic Disclosure (if applicable)",
      "description": "Minnesota requires specific disclosures about private wells and septic systems. This includes location, age, and known issues.",
      "due_offset_days": 3,
      "required": false,
      "guide_key": "well_septic_disclosure"
    },
    {
      "id": "s8",
      "phase": "disclosure",
      "title": "Provide HOA documents (if applicable)",
      "description": "If your property has an HOA, provide the buyer with bylaws, financials, meeting minutes, and current fee schedule.",
      "due_offset_days": 5,
      "required": false
    },
    {
      "id": "s9",
      "phase": "inspection",
      "title": "Schedule and accommodate home inspection",
      "description": "The buyer will hire an inspector of their choosing. Your job is to provide access. Plan to be away from the home during inspection.",
      "due_offset_days": 7,
      "required": true
    },
    {
      "id": "s10",
      "phase": "inspection",
      "title": "Review inspection report with buyer",
      "description": "After inspection, the buyer may submit a repair request. You can agree, decline, or offer a credit. This is negotiable.",
      "due_offset_days": 12,
      "required": true
    },
    {
      "id": "s11",
      "phase": "inspection",
      "title": "Complete any agreed-upon repairs",
      "description": "If you agreed to make repairs, complete them and save receipts. Buyer may request to re-inspect.",
      "due_offset_days": 21,
      "required": false
    },
    {
      "id": "s12",
      "phase": "pre_closing",
      "title": "Confirm closing date and time with title company",
      "description": "Coordinate with the title company, buyer, and any other parties on the final closing date and location.",
      "due_offset_days": -14,
      "required": true
    },
    {
      "id": "s13",
      "phase": "pre_closing",
      "title": "Obtain payoff statement from your lender",
      "description": "This tells the title company exactly how much is needed to pay off your mortgage at closing. Request it at least 2 weeks before closing.",
      "due_offset_days": -14,
      "required": false
    },
    {
      "id": "s14",
      "phase": "pre_closing",
      "title": "Cancel homeowner''s insurance after closing",
      "description": "Do NOT cancel your insurance before closing day. After the deed transfers, notify your insurer.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "s15",
      "phase": "pre_closing",
      "title": "Gather all keys, fobs, codes, and manuals",
      "description": "Collect all house keys, garage openers, mailbox keys, gate codes, alarm codes, and appliance manuals to hand over at closing.",
      "due_offset_days": -3,
      "required": true
    },
    {
      "id": "s16",
      "phase": "closing",
      "title": "Allow final buyer walkthrough",
      "description": "Buyer is entitled to a final walkthrough within 24-48 hours of closing to verify the property condition.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "s17",
      "phase": "closing",
      "title": "Bring valid government-issued photo ID to closing",
      "description": "Title company requires ID to verify your identity before signing transfer documents.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "s18",
      "phase": "closing",
      "title": "Sign the warranty deed and closing documents",
      "description": "The title company will walk you through each document. The warranty deed officially transfers ownership to the buyer.",
      "due_offset_days": 0,
      "required": true,
      "guide_key": "warranty_deed"
    },
    {
      "id": "s19",
      "phase": "closing",
      "title": "Confirm proceeds wire or check",
      "description": "Confirm with the title company how you want to receive your proceeds — wire transfer is recommended for security.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "s20",
      "phase": "closing",
      "title": "Hand over keys 🎉",
      "description": "Congratulations! Once all documents are signed and funds confirmed, hand over the keys. You did it.",
      "due_offset_days": 0,
      "required": true
    }
  ]'
);

INSERT INTO public.checklist_templates (name, role, property_type, state, items)
VALUES (
  'MN Residential Buyer Checklist',
  'buyer',
  'residential',
  'MN',
  '[
    {
      "id": "b1",
      "phase": "immediately",
      "title": "Wire earnest money to escrow",
      "description": "Send your earnest money to the title company escrow account per the Purchase Agreement. Never wire to an individual — verify the wiring instructions by phone to avoid fraud.",
      "due_offset_days": 2,
      "required": true
    },
    {
      "id": "b2",
      "phase": "immediately",
      "title": "Notify your lender — trigger formal loan process",
      "description": "Send your lender the signed Purchase Agreement immediately. This starts the clock on your loan commitment deadline.",
      "due_offset_days": 2,
      "required": true
    },
    {
      "id": "b3",
      "phase": "immediately",
      "title": "Schedule home inspection",
      "description": "Hire a licensed Minnesota home inspector. Cost is typically $300-$500. Do not skip this — it is your best protection.",
      "due_offset_days": 5,
      "required": true
    },
    {
      "id": "b4",
      "phase": "financing",
      "title": "Submit all lender-requested documents promptly",
      "description": "Your lender will request pay stubs, tax returns, bank statements, and more. Delays on your end cause closing delays.",
      "due_offset_days": 7,
      "required": true
    },
    {
      "id": "b5",
      "phase": "financing",
      "title": "Do NOT make large purchases or open new credit",
      "description": "No new cars, credit cards, or large purchases until after closing. This can tank your debt-to-income ratio and kill your loan approval.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "b6",
      "phase": "financing",
      "title": "Lock in your interest rate",
      "description": "Talk to your lender about rate lock timing. Locking too early can expire; too late risks rate increases.",
      "due_offset_days": 10,
      "required": true
    },
    {
      "id": "b7",
      "phase": "due_diligence",
      "title": "Attend home inspection",
      "description": "Be present for the full inspection. Ask questions. The inspector works for you.",
      "due_offset_days": 7,
      "required": true
    },
    {
      "id": "b8",
      "phase": "due_diligence",
      "title": "Review inspection report — submit repair requests",
      "description": "You have a limited window per the Purchase Agreement to submit repair requests or request a price reduction. Do not let this deadline pass.",
      "due_offset_days": 10,
      "required": true,
      "guide_key": "repair_request"
    },
    {
      "id": "b9",
      "phase": "due_diligence",
      "title": "Review seller disclosures carefully",
      "description": "Review the Seller''s Property Disclosure Statement and ask questions about anything that concerns you.",
      "due_offset_days": 7,
      "required": true,
      "guide_key": "seller_disclosure"
    },
    {
      "id": "b10",
      "phase": "due_diligence",
      "title": "Review title commitment",
      "description": "The title company will send a title commitment showing ownership history and any liens or encumbrances. Review it carefully.",
      "due_offset_days": 14,
      "required": true
    },
    {
      "id": "b11",
      "phase": "pre_closing",
      "title": "Bind homeowner''s insurance policy",
      "description": "Get a homeowner''s insurance quote and bind the policy before closing. Your lender will require proof of insurance.",
      "due_offset_days": -7,
      "required": true
    },
    {
      "id": "b12",
      "phase": "pre_closing",
      "title": "Review Closing Disclosure",
      "description": "Federal law requires you receive the Closing Disclosure at least 3 business days before closing. Compare it to your Loan Estimate line by line.",
      "due_offset_days": -3,
      "required": true,
      "guide_key": "closing_disclosure"
    },
    {
      "id": "b13",
      "phase": "pre_closing",
      "title": "Confirm cash-to-close and wire funds",
      "description": "Verify the exact amount needed to close with the title company. Wire funds 1-2 days before closing. Verify wire instructions by phone.",
      "due_offset_days": -1,
      "required": true
    },
    {
      "id": "b14",
      "phase": "pre_closing",
      "title": "Final walkthrough",
      "description": "Walk through the property within 24-48 hours of closing to confirm condition and that agreed repairs were made.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "b15",
      "phase": "closing",
      "title": "Bring valid government-issued photo ID",
      "description": "Required by the title company.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "b16",
      "phase": "closing",
      "title": "Sign all closing documents",
      "description": "This includes the mortgage note, deed of trust, and many other documents. Take your time — ask questions.",
      "due_offset_days": 0,
      "required": true
    },
    {
      "id": "b17",
      "phase": "closing",
      "title": "Receive keys 🎉",
      "description": "Welcome home! After all documents are signed and funds confirmed, you get the keys.",
      "due_offset_days": 0,
      "required": true
    }
  ]'
);
