# SAP BTP Reference

## TL;DR (read this first)
- **SAP BTP is the cloud platform** for building, integrating, and extending SAP applications using a unified suite of services and runtimes.
- **CAP (Cloud Application Programming Model)** is our primary backend framework, using CDS to define data models and OData services, deployed to the Cloud Foundry runtime.
- **SAP Build Apps** is the low-code/visual development tool for citizen developers to build web and mobile UIs that consume our CAP OData APIs.
- **SAP Build Process Automation (BPA)** is used to model, automate, and execute business processes (workflows) and robotic tasks, triggered by events from our CAP backend.
- **The BTP Admin** manages the technical platform: subaccount, entitlements, service provisioning, security (roles/trust), and final deployment of all application modules (CAP, Build Apps, BPA).

## Sections Index
1. BTP Services Overview (line ~20)
2. CAP Concepts (line ~80)
3. SAP Build Apps Patterns (line ~130)
4. BPA Capabilities (line ~180)
5. BTP Admin Tasks (line ~230)

## 1. BTP Services Overview
SAP Business Technology Platform (BTP) is the integrated PaaS offering for building, running, and managing SAP applications and extensions in the cloud.

**Key Concepts:**
- **Service Categories:** Platform is structured into solution areas: **Integration Suite** (APIs, events), **Extension Suite** (CAP, Side-by-Side extensions), **Data & Analytics** (HANA Cloud, Data Warehouse), and **AI** (pre-trained services).
- **Account Structure:** Global Account → Directories (for grouping) → Subaccounts (the operational unit). Our project uses one subaccount. Subaccounts contain orgs/spaces (Cloud Foundry) or namespaces (Kyma).
- **Runtimes:** We use **Cloud Foundry (CF)** as the primary polyglot runtime (Node.js, Java). Kyma (K8s) is an alternative for container-based workloads.
- **Entitlements & Marketplace:** Services are activated via entitlements (quotas). The Service Marketplace lists all available services to provision instances (e.g., HANA Cloud, Workflow, Build Apps).
- **Practical Need:** Agents must know which services are provisioned, how to access them via cockpit, and that Cloud Foundry CLI (`cf login`, `cf push`) is the primary deployment tool for CAP apps.

## 2. CAP Concepts
The Cloud Application Programming Model (CAP) is a framework of languages, libraries, and tools for building enterprise-grade services and applications.

**Core Components:**
- **CDS (Core Data Services):** Declarative modeling language for defining data structures (entities, types, associations) and services. The source of truth for schema.
- **Service Exposure:** CDS models are automatically served as **OData V4** APIs. Define services in `.cds` files; CAP generates provisioning code.
- **Runtime:** We use **Node.js**. Primary CLI is `@sap/cds` (`cds build`, `cds deploy`, `cds watch` for live reload).
- **Database:** **HANA Cloud** is the production DB. Use **SQLite** for local development (configured in `package.json` `cds` section).
- **Annotations:** Add UI (Fiori Elements) and validation annotations (`@UI`, `@Common`) directly in CDS models.
- **Authorization:** Declare access control via `@restrict` annotations in service definitions. Requires integration with XSUAA service.
- **Focus for CAP Developer:** Model entities and services in CDS, implement custom logic in handlers, test OData APIs locally, and prepare for CF deployment.

## 3. SAP Build Apps Patterns
SAP Build Apps is a visual, low-code application development environment for creating web and mobile frontends.

**Key Development Patterns:**
- **Visual Builder:** Drag-and-drop interface with a library of UI components (Text, Input, Button, List, Container).
- **Data Binding:** Use the **Formula Builder** (JavaScript-like expressions) to bind component properties to data sources (variables, API responses).
- **Variables:** Manage state via **App Variables** (global), **Page Variables** (page-scoped), or **Component Values** (local).
- **OData Integration:** Use the **Data Entity** component to connect to our CAP backend OData services. Configure with service URL and authentication (Destination).
- **Logic Canvas:** Define application behavior with event-triggered **Logic Flows** (e.g., Button Click → Call API → Set Variable → Navigate).
- **Output & Deployment:** Build for Web, iOS, or Android. Deploy by publishing to the **BTP HTML5 Application Repository**, which hosts the static frontend.
- **Focus for Build Apps Developer:** Consume CAP OData endpoints, design responsive UIs using components and logic flows, and manage application state with variables.

## 4. BPA Capabilities
SAP Build Process Automation combines workflow management, decision automation, and robotic process automation (RPA) into one service.

**Core Capabilities:**
- **Process Designer:** Model business processes using a BPMN 2.0 visual editor (drag-drop activities like User Tasks, Script Tasks, Gateways).
- **Automation Projects:** Create **Bots** (RPA scripts) to automate repetitive UI tasks in desktop or web applications.
- **Decision Modeling:** Use **Decision Tables** or flowcharts to encapsulate business rules.
- **Triggers:** Processes can be started via: API trigger (calling a BPA-provided REST endpoint), **Form** submission (from Build Apps), or event (e.g., email).
- **Integration:** BPA processes call backend systems. For our project, this is primarily our **CAP OData APIs** for business logic and data operations.
- **Agent Involvement:** **BPA Designer** models processes/bots. **CAP Developer** must expose a simple OData action or endpoint to serve as the API trigger for starting a workflow.
- **Focus for BPA Designer:** Map process steps in BPMN, identify manual vs. automated tasks, define decision logic, and configure triggers from our application frontend or backend.

## 5. BTP Admin Tasks
The BTP Administrator configures the platform, manages resources, and ensures secure deployment.

**Key Project Tasks:**
- **Subaccount Setup:** Create/configure the project subaccount (region, environment: Cloud Foundry).
- **Entitlements:** Assign quotas for required services: **SAP HANA Cloud**, **SAP Build Apps**, **SAP Build Process Automation**, **Destination Service**, **Authorization & Trust Management (XSUAA)**.
- **Service Instances:** Provision instances of the entitled services via CLI (`btp create services/instance`) or Cockpit.
- **Security:**
  - **Role Collections:** Create collections in the Cloud Foundry space and assign business catalogs (e.g., `BuildAppsAdmin`).
  - **Trust Configuration:** Establish trust with an Identity Provider (IdP) for user authentication (often SAP ID Service default).
- **Deployment:** Handle the final **Multi-Target Application (MTA)** deployment using the CF CLI (`cf deploy mta_archive.mtar`). The MTA bundles CAP, HTML5, and service bindings.
- **Monitoring:** Use the BTP Cockpit to monitor subaccount usage, service instances, and application health.
- **Focus for BTP Admin:** Ensure all services are provisioned, roles assigned for developers/users, and the integrated application (CAP + Build Apps + BPA) is successfully deployed to the CF space.
