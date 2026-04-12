---
scenario: hr-services
industry: Human Resources Shared Services
status: default
---

# Client Scenario: HR Shared Services

## Company Profile
PeopleEdge HR Services is a mid-size HR Shared Services provider (~500 employees) based in Bangalore, India. It serves over 20 enterprise clients across manufacturing and retail sectors, offering outsourced payroll processing, leave management, employee onboarding, and statutory compliance.

## Business Context
PeopleEdge manages HR processes on behalf of its clients, who predominantly run SAP S/4HANA. The company uses a legacy SAP HCM system for its own operations. They need SAP BTP to digitally transform client interactions, enable real-time integration with client S/4HANA systems, and build unified self-service portals to replace fragmented client-specific processes.

## Key Challenges
1. **Manual Leave Management**: Processing leave requests across 20+ different client portals and internal systems.
2. **Multi-System Onboarding**: Duplicate data entry for new hires into client S/4HANA, internal HCM, and payroll systems.
3. **Approval Bottlenecks**: Manager approvals stuck in emails, causing SLA breaches for payroll finalization.
4. **Compliance Reporting**: Manual consolidation of data into Excel for monthly statutory reports is error-prone.
5. **Poor Visibility**: End users (client HR) lack real-time status tracking for submitted requests.

## Proposed SAP BTP Solution Scope
1. **CAP Service for Leave Management**: Develop a central CAP application exposing a unified leave API, integrating with client S/4HANA and SAP SuccessFactors.
2. **SAP Build Apps Mobile App**: A cross-platform mobile application for client managers to review and approve leave/onboarding requests.
3. **SAP Build Process Automation**: Automate the multi-system onboarding workflow with RPA bots for data entry and human approvals.

## Success Metrics
1. Reduce manual process steps by 70%.
2. Decrease approval turnaround time from 3 days to under 4 hours.
3. Shorten end-to-end onboarding cycle from 5 days to 1 day.
4. Automate compliance report generation, eliminating 2 days of manual effort monthly.
5. Achieve 95% user satisfaction for request visibility via self-service portal.
6. Reduce payroll processing errors related to leave data by 90%.

## Key Contacts (Fictional)
1. **Priya Sharma, HR Director**: Strategic sponsor; focuses on service quality and SLAs.
2. **Arjun Mehta, IT Integration Lead**: Responsible for technical architecture and S/4HANA connectivity.
3. **Deepika Patel, Process Excellence Manager**: Owns process mapping, user training, and benefit realization.

## Constraints
* **Timeline**: 12-week engagement for pilot with 3 key clients.
* **Budget**: Initial scope limited to SAP BTP trial credits and one production subaccount.
* **Compliance**: Client employee data must reside in India, adhering to PDPA guidelines.
* **Integration**: Solution must not disrupt or modify the existing core SAP HCM system.
