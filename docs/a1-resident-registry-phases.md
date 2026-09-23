# Resident Registry: six implementation phases

The municipality owns one permanent person identity. Barangay assignments, households, credentials, and services refer to that identity rather than creating a new person when someone moves.

## 1. Staff screens and field inventory

Build the resident directory and four-step intake form using the shared staff design. Confirm the person fields, address hierarchy, and barangay names. The four steps are Identity, Residency, Possible matches, and Review. These screens are previews until a secure data service exists. The Possible matches step must not claim a check occurred while no matching service is connected.

## 2. Secure identity foundation

Add staff authentication and barangay-scoped roles, the person and residency schema, normalized address references, server-side validation, an immutable and never-reissued LRN allocator, and an optional tokenized PhilSys reference. Actual LRN issuance stays gated until duplicate review is available. Store no PhilSys value in browser storage or logs.

## 3. Municipality-wide duplicate review

Normalize names, suffixes, married and former names, and nicknames; compare birthdate, mother's maiden name, and household co-membership across all 40 barangays. Route candidates to a reviewer before creating or merging identities. Log every merge and reversal.

## 4. Residency and life events

Record dated barangay residency periods and life events. Implement origin release and destination acceptance for transfers while preserving the permanent person identity and earlier history.

## 5. Photo, signature, and ID credentials

Store photo and signature with restricted access. Generate ID cards and QR codes. The public QR check returns validity status only, never personal fields or a full record.

## 6. Scoped search, audit, and launch checks

Provide role-scoped fuzzy search and APIs, enforce permissions in every query, audit sensitive actions, verify migration and reversal behavior, and test cross-barangay cases before live use.
