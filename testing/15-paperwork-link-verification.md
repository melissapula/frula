# Test Card 15 — Paperwork Link Verification

**Priority:** HIGH (pre-launch)
**Goal:** Verify every external link in the paperwork directory works and points to the correct official resource. Add direct form/document URLs where available.

---

## How to use this card

For each state and federal document:

1. Click the current link and verify it loads
2. Navigate to the actual forms/documents page (not just the commission homepage)
3. If you find a direct link to forms, update `officialPdfUrl` in `state-resources.ts` or `guides.ts`
4. Check the box when verified

**File to edit:** `apps/web/app/data/paperwork/state-resources.ts`
**Federal guides:** `apps/web/app/data/paperwork/guides.ts`

---

## Federal Documents

- [ ] **Lead-Based Paint Disclosure** — EPA: https://www.epa.gov/lead/real-estate-disclosure
- [ ] **Closing Disclosure** — CFPB: https://www.consumerfinance.gov/owning-a-home/closing-disclosure/
- [ ] **Form 1099-S** — IRS: https://www.irs.gov/forms-pubs/about-form-1099-s
- [ ] **Fair Housing Act** — HUD: https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview

---

## State Commission Links

Verify each state commission link loads. If you find a direct "forms" or "consumer resources" page, update the URL to point there instead of the homepage.

### A States

- [ ] **Alabama** — https://arec.alabama.gov/
- [ ] **Alaska** — https://www.commerce.alaska.gov/web/cbpl/ProfessionalLicensing/RealEstateCommission.aspx
- [ ] **Arizona** — https://azre.gov/
- [ ] **Arkansas** — https://www.arec.arkansas.gov/

### C States

- [ ] **California** — https://www.dre.ca.gov/
- [ ] **Colorado** — https://dre.colorado.gov/
- [ ] **Connecticut** — https://portal.ct.gov/dcp/occupational-and-professional-division/occupational-boards/connecticut-real-estate-commission

### D-F States

- [ ] **Delaware** — https://dpr.delaware.gov/boards/realestate/
- [ ] **District of Columbia** — https://dlcp.dc.gov/page/real-estate-board
- [ ] **Florida** — https://www.myfloridalicense.com/DBPR/real-estate-commission/

### G-H States

- [ ] **Georgia** — https://grec.state.ga.us/
- [ ] **Hawaii** — https://cca.hawaii.gov/pvl/boards/realestate/

### I States

- [ ] **Idaho** — https://irec.idaho.gov/
- [ ] **Illinois** — https://idfpr.illinois.gov/profs/realest.html
- [ ] **Indiana** — https://www.in.gov/pla/professions/real-estate-home/
- [ ] **Iowa** — https://plb.iowa.gov/board/real-estate

### K-L States

- [ ] **Kansas** — https://www.krec.ks.gov/
- [ ] **Kentucky** — https://krec.ky.gov/
- [ ] **Louisiana** — https://www.lrec.gov/

### M States

- [ ] **Maine** — https://www.maine.gov/pfr/professionallicensing/professions/real-estate-commission
- [ ] **Maryland** — https://www.dllr.state.md.us/license/mrec/
- [ ] **Massachusetts** — https://www.mass.gov/orgs/board-of-registration-of-real-estate-brokers-and-salespersons
- [ ] **Michigan** — https://www.michigan.gov/lara/bureau-list/bpl/occ/prof/real-estate
- [ ] **Minnesota** — https://mn.gov/commerce/business/real-estate/index.jsp
- [ ] **Mississippi** — https://www.mrec.ms.gov/
- [ ] **Missouri** — https://pr.mo.gov/realestate.asp
- [ ] **Montana** — https://boards.bsd.dli.mt.gov/realty-regulation/

### N States

- [ ] **Nebraska** — https://nrec.nebraska.gov/
- [ ] **Nevada** — https://red.nv.gov/
- [ ] **New Hampshire** — https://www.oplc.nh.gov/find-board/nh-real-estate-commission
- [ ] **New Jersey** — https://www.nj.gov/dobi/division_rec/
- [ ] **New Mexico** — https://www.rld.nm.gov/boards-and-commissions/individual-boards-and-commissions/new-mexico-real-estate-commission/
- [ ] **New York** — https://dos.ny.gov/real-estate-broker
- [ ] **North Carolina** — https://www.ncrec.gov/
- [ ] **North Dakota** — https://www.realestatend.org/

### O-P States

- [ ] **Ohio** — https://elicense3.com.ohio.gov/
- [ ] **Oklahoma** — https://oklahoma.gov/orec.html
- [ ] **Oregon** — https://www.oregon.gov/rea/
- [ ] **Pennsylvania** — https://www.dos.pa.gov/ProfessionalLicensing/BoardsCommissions/RealEstateCommission/

### R-S States

- [ ] **Rhode Island** — https://dbr.ri.gov/divisions/commercial-licensing/real-estate
- [ ] **South Carolina** — https://llr.sc.gov/re/
- [ ] **South Dakota** — https://dlr.sd.gov/realestate/

### T-U States

- [ ] **Tennessee** — https://www.tn.gov/commerce/regboards/trec.html
- [ ] **Texas** — https://www.trec.texas.gov/
- [ ] **Utah** — https://realestate.utah.gov/

### V-W States

- [ ] **Vermont** — https://sos.vermont.gov/real-estate-commission/
- [ ] **Virginia** — https://www.dpor.virginia.gov/Boards/Real-Estate
- [ ] **Washington** — https://www.dol.wa.gov/business/realestate/
- [ ] **West Virginia** — https://rec.wv.gov/
- [ ] **Wisconsin** — https://dsps.wi.gov/Pages/BoardsCouncils/RealEstate/Default.aspx
- [ ] **Wyoming** — https://realestate.wyo.gov/

---

## Per-State Document Hunt

For each state, try to find direct links to these key documents. Not every state will have all of them — some states don't provide standardized forms. Note what you find and what doesn't exist.

### What to look for on each state's site:

- [ ] **Seller's Property Disclosure form** — the state-required disclosure sellers must fill out
- [ ] **Residential Purchase Agreement** — standardized purchase contract (many states don't have one — REALTOR associations provide them instead)
- [ ] **Lead paint disclosure** — state-specific version or addendum (federal form covers most)
- [ ] **Consumer guide for FSBO** — any "selling without an agent" resources
- [ ] **License lookup tool** — URL for verifying a real estate professional's license
- [ ] **Complaint/consumer protection page** — where buyers/sellers can file complaints

### States with known FSBO-friendly resources (check these first):

- [ ] **Texas** — TREC provides standardized contracts anyone can use (not just agents)
- [ ] **California** — DRE has extensive consumer resources
- [ ] **Florida** — good consumer-facing forms section
- [ ] **Minnesota** — Commerce dept has consumer real estate pages
- [ ] **New York** — DOS has disclosure forms publicly available
- [ ] **Ohio** — has transaction forms and disclosures section
- [ ] **North Carolina** — NCREC has standardized forms
- [ ] **Georgia** — GREC has disclosure forms available

---

## Concept Guide Links

Verify that each concept guide's `officialPdfUrl` still works:

- [ ] **Seller's Property Disclosure** — concept guide (no single federal link — state-specific)
- [ ] **Purchase Agreement** — concept guide (no single federal link — state-specific)
- [ ] **Title Insurance** — concept guide (no single federal link — varies by provider)
- [ ] **Home Inspection** — concept guide (no single federal link — varies)
- [ ] **Deed Types** — concept guide (no single federal link — county-level)

---

## When you find a direct form link

Update `state-resources.ts` — change the `url` field to point to the forms page rather than the commission homepage. Example:

```typescript
// Before:
url: 'https://www.trec.texas.gov/',

// After (if you find a direct forms page):
url: 'https://www.trec.texas.gov/forms',
```

For federal guides, update `officialPdfUrl` in `guides.ts`.

---

## Notes

- Some state commissions block automated requests (403) — the link checker flags these as warnings, not failures. They work fine in a browser.
- If a state doesn't provide standardized forms (they rely on REALTOR association forms instead), that's fine — just verify the commission link works and note it.
- Don't link to REALTOR association forms — those typically require membership. Only link to official state/government sources.
