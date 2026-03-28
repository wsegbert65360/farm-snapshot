# Project Blueprint: FarmCMD

This document defines the architectural standards, patterns, and best practices for the FarmCMD project. All new features and refactors must adhere to these guidelines to ensure consistency, security, and a premium user experience.

## 1. Architectural Patterns

### Service-Oriented Logic
- **Business Logic Layer**: All API integrations and complex calculations MUST reside in the `lib/` directory (e.g., `lib/grain.ts`, `lib/weather.ts`).
- **Separation of Concerns**: Components should focus on presentation, while data fetching and transformation should be handled by the service layer.

### Data Fetching Strategy (SSR/ISR)
- **Primary Dashboard**: Use Server-Side Rendering (SSR) in `app/page.tsx` for initial data fetching to ensure a fast, "no-loading-flash" experience.
- **Incremental Static Regeneration (ISR)**: Use `export const revalidate = 900;` (15 minutes) or similar intervals for data that doesn't change every second.

### Configuration Management
- **Centralized Config**: All environment variables MUST be accessed via `lib/config.ts`.
- **Validation & Fallbacks**: Provide sensible fallbacks and validation for every configuration value to ensure the app remains functional even with missing `.env` variables.

## 2. Technical Standards

### Strict Typing
- All core data structures MUST be defined in `lib/types.ts`.
- Use interfaces for data models and shared component props.
- Avoid the use of `any`; prefer generics or `unknown` with validation guards.

### Security
- **API Keys**: Sensitive API keys MUST be passed in headers (e.g., `Authorization`) rather than query parameters when possible.
- **Request Reliability**: Every external `fetch` request MUST implement a timeout using `AbortController` (default 10s).
- **SSL/HTTPS**: Ensure all external endpoint URLs use `https`.

### UI/UX Consistency
- **Premium Aesthetics**: Follow a clean, modern design with a unified color palette (e.g., Slate for text/borders, Blue for primary accents, Green/Red for status).
- **Unified Formatting**: "Updated at" timestamps, currency, and units (e.g., Bushels, MPH) must be formatted consistently across all dashboard cards.
- **Responsive Design**: Ensure all cards and layouts are optimized for both mobile and desktop viewports.

## 3. Implementation Workflow

1.  **Types First**: Define the data model in `lib/types.ts`.
2.  **Service Layer**: Implement the data fetching/logic in `lib/`.
3.  **Config**: Add any new environment variables to `.env.example` and `lib/config.ts`.
4.  **UI Component**: Build the presentational component in `components/`.
5.  **Integration**: Wire everything together in `app/page.tsx` or a relevant route.
6.  **Verification**: Run `npm run build` to ensure no type regressions.

---
*Last updated: March 28, 2026*
