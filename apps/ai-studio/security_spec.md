# Security Specification & Payload-First TDD

## 1. Core Data Invariants
1. **Strict Ownership**: Every top-level resource (`spaces`, `tabs`, `conversations`, `agents`, `missions`, `approvals`, `activityLogs`, `reports`, `connections`, `spendingPolicies`, `simulatedTransactions`) requires `ownerId == request.auth.uid` on create, read, list, update, and delete.
2. **PII Isolation**: User email is stored solely under `/users/{userId}/private/{docId}`, readable and writable only by the owning verified user (`request.auth.uid == userId && request.auth.token.email_verified == true`).
3. **Master Gate on Subcollections**: `/conversations/{conversationId}/messages/{messageId}` and `/missions/{missionId}/steps/{stepId}` verify the parent document's `ownerId == request.auth.uid` via `get()`.
4. **Immutable Audit & Ledger Records**: `activityLogs` and `simulatedTransactions` cannot be updated or deleted once created.
5. **Terminal State Locking**: Once a `missions/{missionId}` reaches `COMPLETED` or `CANCELLED`, or an `approvals/{approvalId}` reaches `APPROVED`, `REJECTED`, `EXECUTED`, or `EXPIRED`, client updates are forbidden.
6. **Simulation Safety**: `spendingPolicies.realPaymentsEnabled` must remain `false` and `simulatedTransactions.isSimulated` must always be `true`.
7. **Zero Token Storage**: `connections` only stores connection status booleans and scope names; OAuth tokens are strictly kept in memory and never persisted to Firestore.
8. **Temporal Integrity**: All `createdAt` and `updatedAt` fields must equal `request.time` on creation/update.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Space Create**: `{ id: "sp1", ownerId: "victim-uid", name: "Work", slug: "work", splitLayout: 4, notes: "", createdAt: serverTime, updatedAt: serverTime }` -> MUST be rejected (`ownerId != request.auth.uid`).
2. **Ghost Field / Shadow Update**: Updating a Space with `{ isAdmin: true, updatedAt: serverTime }` -> MUST be rejected by `affectedKeys().hasOnly(...)` and `keys().hasOnly(...)`.
3. **Resource Exhaustion / Oversized ID**: Creating a Tab with `tabId = "a".repeat(500)` -> MUST be rejected by `isValidId(tabId)` (`<= 128` chars & regex).
4. **Timestamp Forgery**: Creating a Mission with `createdAt: Timestamp(2020-01-01)` instead of `request.time` -> MUST be rejected.
5. **Terminal Approval Resurrection**: Updating an `approvals/{id}` document whose existing `status == "REJECTED"` back to `"PENDING"` or `"APPROVED"` -> MUST be rejected by terminal state lock.
6. **Simulated Payment Tampering**: Creating a `simulatedTransactions/{id}` with `isSimulated: false` or negative `amountUsd: -500` -> MUST be rejected by `isValidSimulatedTransaction`.
7. **Real Payment Activation**: Creating or updating `spendingPolicies/{id}` with `realPaymentsEnabled: true` -> MUST be rejected.
8. **Unverified Email Write**: Authenticated user with `request.auth.token.email_verified == false` attempting to create a Mission -> MUST be rejected.
9. **Blanket List Scraping**: Calling `list` on `/missions` without `where('ownerId', '==', uid)` -> MUST be rejected by `resource.data.ownerId == request.auth.uid`.
10. **Orphaned Mission Step Injection**: Attacker creating `/missions/{victimMissionId}/steps/{stepId}` with `ownerId: attackerUid` -> MUST be rejected by parent `get()` Master Gate (`parent.ownerId == request.auth.uid`).
11. **Audit Log Erasure**: Attacker or owner attempting `delete` or `update` on `/activityLogs/{logId}` -> MUST be rejected (`allow update, delete: if false`).
12. **PII Cross-User Read**: User A calling `get` on `/users/userB/private/info` -> MUST be rejected.
