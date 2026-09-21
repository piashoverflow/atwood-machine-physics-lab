# Security & Confidentiality Policy

## Confidentiality & Academic Integrity
This repository contains academic, educational, and computational research artifacts authored by **Shamsuddin Piash** (Department of Mechanical Engineering, Bangladesh University of Engineering and Technology - BUET).

1. **Proprietary & Academic Data Protection**:
   - Underlying institutional exam materials, proprietary commercial CAD geometries, and unpublished manuscripts are subject to strict academic integrity, institutional agreements, and journal peer-review embargoes.
   - Any sensitive datasets or confidential benchmark matrices are sanitized before publishing.

2. **Environment & Secrets Hygiene**:
   - Never commit `.env`, `.env.local`, API keys, private keys (`*.pem`, `*.key`), or institutional credentials to this repository.
   - All external API calls (e.g. Gemini AI or cloud compute) must use securely injected environment variables via CI/CD secrets or local environment variables.

## Reporting a Security Vulnerability
If you discover a potential security flaw, vulnerability, or accidental exposure of confidential information in this repository, please report it privately:

- **Security Contact**: Shamsuddin Piash
- **Email**: [mohammadshamsuddinpiash0722@gmail.com](mailto:mohammadshamsuddinpiash0722@gmail.com)
- **PGP / Secure Channel**: Available upon request.

Please do **not** open public GitHub issues for security vulnerabilities. Reports will be reviewed within 48 hours.
