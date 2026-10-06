---
description: Implement Rate Limiting for Exports (Local + Global)
---

I have implemented a comprehensive rate limiting mechanism for the export functionalities in `src/App.tsx`, combining a local per-user limit with a global limit using Firebase.

1.  **Rate Limit Helper Functions**:
    *   `checkRateLimit`: Tracks local usage via `localStorage` (Key: `user_export_history`). It enforces a limit of **20 downloads per hour per user** (combined for all export types).
    *   `checkGlobalRateLimit`: Tracks global usage via Firebase Realtime Database (`exportUsageRef`). It enforces a limit of **40 downloads per hour globally**. This method uses `runTransaction` to ensure atomic updates and concurrency safety.

2.  **Export by Dates** (`exportByDateToImage`):
    *   Checks local limit (20/hour).
    *   Checks global limit (40/hour).
    *   Alerts the user appropriately if either limit is hit.

3.  **Export Specific Festival** (`exportFestivalToImage`):
    *   Checks local limit (20/hour).
    *   Checks global limit (40/hour).
    *   Alerts the user appropriately if either limit is hit.

4.  **Firebase Integration**:
    *   Updated `src/utils/firebase.ts` to export `runTransaction` and define `exportUsageRef`.
    *   This ensures the global counter is stored and synchronized across all users.

This dual-layer protection prevents individual abuse while also protecting the service from excessive global load.
