---
scenario: manufacturing
industry: Discrete Manufacturing
status: stub
---

# Client Scenario: Discrete Manufacturing

## Company Profile
Mid-size discrete manufacturer (~2,000 employees) producing industrial equipment.
Multiple plants across India with SAP ECC on-premise as core ERP.

## Key Challenges
- Production order visibility gaps between shop floor and SAP
- Manual quality inspection logging with no real-time traceability
- Spare parts procurement delays due to approval bottlenecks
- No mobile interface for plant supervisors

## Proposed SAP BTP Scope
- CAP service for production order status API
- SAP Build Apps app for quality inspection on shop floor (mobile-first)
- SAP BPA workflow for spare parts purchase approval

## Success Metrics
- Reduce quality inspection logging time by 60%
- Purchase approval cycle from 5 days to same-day
- Zero manual data re-entry for production order updates

---

> Stub scenario — activate with: `node reset.js --scenario manufacturing`
