# **App Name**: ThreatLens-X

## Core Features:

- Log Ingestion and Enrichment: Ingest logs (login attempts, access patterns, resource usage) and enrich events with contextual attributes (time of access, frequency patterns, device/location novelty, user role, asset criticality).
- CyberDNA Behavioral Fingerprinting: Establish a behavioral baseline per user/device, tracking login time distributions, resource access order, and API call frequency to detect deviations from established patterns. Output probabilistic anomaly scores.
- Adaptive Risk Brain (Self-Tuning Risk Scoring): Combine rule-based severity, contextual anomaly scores, and behavioral deviation scores to calculate a risk score (0-100). Implement a feedback loop to adaptively tune scores based on confirmed/ignored alerts.
- ThreatLens AI - Explainable Intelligence: Generate clear, human-readable explanations for each flagged event, detailing the causal and contextual factors contributing to the risk score.
- Visualization & Reporting Dashboard: Display detected threats, risk scores, behavioral deviations, and explanation texts in a simple dashboard.

## Style Guidelines:

- Primary color: Deep blue (#CFFFDC) to convey security and trust.
- Background color: Light gray (#253D2C), offering a clean and neutral backdrop to highlight key data points.
- Accent color: Soft amber (#68BA7F), used for highlighting alerts and interactive elements.
- Body and headline font: 'Inter', a sans-serif font providing a modern, objective feel suitable for displaying metrics and reports.
- Code font: 'Source Code Pro' for displaying log snippets.
- Use clear, consistent icons to represent different types of threats, users, and system components.
- Design a clean, dashboard-style layout to display data efficiently.