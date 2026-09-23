# Matnog Barangay Affairs

A Next.js prototype for the Municipality of Matnog Barangay Affairs Management System. It supports municipality-wide and barangay-specific staff workspaces for all 40 barangays, plus a barangay-aware public information portal.

## Implemented areas

- Resident and household registry workflows
- Sector registry and certification workflows
- Document requests, issuance, printing, reprints, revocation, and verification
- Peace and order records, including blotter, justice, VAW, BCPC, and BADAC
- Frontline services, assistance, disaster response, business records, and planning
- User administration, roles, permissions, audit logs, privacy, retention, and security
- Public barangay directory, officials, transparency records, projects, document verification, and citizen feedback

The current implementation uses connected dummy data and browser-local state for presentation and workflow testing. A production backend, authentication provider, database, secure file storage, and deployment configuration are still required.

## Run locally

Use Node.js 22.22.2 or a compatible Node.js 22 release.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run check
npm run typecheck
npm run build
```

The public portal is available at `/`. The staff portal is available at `/barangay-affairs`.
