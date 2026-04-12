---
scenario: retail
industry: Omnichannel Retail
status: stub
---

# Client Scenario: Omnichannel Retail

## Company Profile
Growing omnichannel retailer (~300 stores, large e-commerce presence).
SAP S/4HANA Cloud for finance, legacy WMS for warehouse operations.

## Key Challenges
- Inventory discrepancies between online and in-store systems
- Returns processing is manual and slow (3-5 day resolution)
- Store manager reporting requires IT involvement for every custom report
- Customer loyalty data siloed from SAP

## Proposed SAP BTP Scope
- CAP service for unified inventory API (S/4HANA + WMS integration)
- SAP Build Apps app for store manager self-service reporting
- SAP BPA workflow for returns authorization

## Success Metrics
- Inventory accuracy from 87% to 99%
- Returns resolution from 3 days to 4 hours
- Store managers self-serve 80% of reporting needs without IT

---

> Stub scenario — activate with: `node reset.js --scenario retail`
