# Security Specification for PeakPulse Korea Firebase Integration

## 1. Data Invariants
1. **Public Readability with Author Integrity**: Anyone can read the public mountain summits and running activities (`/activities/{activityId}`) to explore Korea's peaks, view progress, and admire summit records.
2. **Authenticated / Owner Write Restriction**: Only authenticated users can create activities. On creation, `authorUid` must match `request.auth.uid`.
3. **Immutability of Key Identifiers**: On update, `id` and `authorUid` cannot be altered.
4. **Data Size Bounds**: String fields (titles, mountain names, notes) are bounded by maximum string lengths to prevent Denial of Wallet and storage bloat.
5. **Admin Authorization**: Dedicated `/admins/{adminId}` collection tracks administrative authority. Only admins can manage the admin collection or modify activities on behalf of the system.
6. **Default-Deny**: Any unmatched paths or unrecognized operations are strictly denied.

## 2. The "Dirty Dozen" Payloads (Designed to Fail Validation)
1. **Payload 1 - Unauthenticated Create**: An unauthenticated client attempting to create an activity in `/activities/act_1`. (Must fail: `request.auth != null` violation).
2. **Payload 2 - Identity Spoofing on Create**: Authenticated user `user_123` submitting an activity with `authorUid: "user_victim"`. (Must fail: `incoming().authorUid == request.auth.uid` violation).
3. **Payload 3 - Shadow Fields (Ghost Properties)**: Submitting an activity with unexpected property `isVerifiedSystemAdmin: true`. (Must fail: strict allowed keys check).
4. **Payload 4 - Immense String Injection (Denial of Wallet)**: Injecting a 2MB string into `notes`. (Must fail: `notes.size() <= 2000` violation).
5. **Payload 5 - Negative Distance / Numeric Poisoning**: Creating an activity with `distanceKm: -50.0`. (Must fail: `distanceKm >= 0` check).
6. **Payload 6 - Negative Duration**: Creating an activity with `durationMinutes: -120`. (Must fail: `durationMinutes > 0` check).
7. **Payload 7 - Invalid Activity Type**: Submitting `activityType: 'deep_sea_diving'` which is outside the enum `['summit', 'running']`. (Must fail: enum check).
8. **Payload 8 - Modifying Author UID (Takeover Attempt)**: An attacker attempting to update existing activity to change `authorUid: "attacker_uid"`. (Must fail: immutable `authorUid` check).
9. **Payload 9 - Non-Admin Writing to Admin Collection**: Regular user attempting to write themselves into `/admins/user_123` as `role: "admin"`. (Must fail: `isAdmin()` check).
10. **Payload 10 - ID Poisoning with Junk Characters**: Creating a document at `/activities/invalid@@path!!##$$` with invalid special characters. (Must fail: `isValidId(activityId)` check).
11. **Payload 11 - Deleting Another User's Activity**: Regular user `user_abc` attempting to delete `activity` owned by `user_xyz`. (Must fail: `resource.data.authorUid == request.auth.uid || isAdmin()` check).
12. **Payload 12 - Corrupted Photos Array**: Submitting a `photos` array with over 50 items. (Must fail: bounded array `.size() <= 30` check).
