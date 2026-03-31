# Wellness Booking System

A single-page React application for managing spa/wellness bookings, built as a technical assessment.

## Tech Stack

- **React 19** (Create React App)
- **Zustand v5** — global state management
- **@dnd-kit/core** — drag-and-drop rescheduling
- **@tanstack/react-virtual** — virtual rendering for the therapist calendar
- **Axios** — HTTP client with auth interceptor

---

## Architecture Overview

```
src/
├── api/              # HTTP layer (Axios calls, FormData construction)
│   ├── client.js     # Axios instance with auth token interceptor
│   ├── authApi.js    # Login / logout / profile
│   ├── bookingApi.js # CRUD + check-in/out/cancel
│   └── therapistApi.js
├── store/            # Zustand stores (one per domain)
│   ├── authStore.js
│   ├── bookingStore.js
│   ├── therapistStore.js
│   └── uiStore.js
├── styles/
│   └── shared.module.css   # Reusable CSS classes (panel, form inputs, buttons, avatar, spinner)
├── components/
│   ├── Calendar/
│   │   ├── CalendarBoard.js / .module.css
│   │   ├── TherapistColumn.js / .module.css
│   │   ├── BookingBlock.js / .module.css
│   │   └── TimeColumn.js / .module.css
│   ├── Booking/
│   │   ├── BookingPanel.js / .module.css
│   │   ├── CreateBookingModal.js / .module.css
│   │   ├── EditBookingModal.js / .module.css
│   │   └── CancelModal.js / .module.css
│   ├── Layout/
│   │   ├── Header.js / .module.css
│   │   └── LoginPage.js / .module.css
│   └── common/
│       ├── Toast.js / .module.css
│       ├── FilterDropdown.js / .module.css
│       ├── ErrorBoundary.js / .module.css
│       └── Button.js, FormField.js, SearchBar.js
└── utils/
    ├── dateUtils.js  # Time-to-pixel helpers (getBookingTop, getBookingHeight)
    ├── bookingUtils.js
    └── logger.js     # Thin structured logger (wraps console in dev only)
```

### Styling approach

All styles use **CSS Modules** (`.module.css`) for scoped, conflict-free class names. Reusable patterns (panel drawer, form inputs, buttons, avatar, spinner) live in `src/styles/shared.module.css` and are imported by multiple components. Inline `style={{}}` is kept only for genuinely runtime-dynamic values — status-based colors, gender-based avatar colors, computed pixel positions from virtualizer/time math, and boolean-toggled opacity/zIndex.

### Data flow

1. `App.js` boots → fetches therapists, rooms, services, and bookings for the selected date.
2. `bookingStore` normalises the API response (`booking_item` is a customer-keyed object) into flat booking records with `therapist_id`, `start_time`, `end_time`, `room_item_id`, etc.
3. `CalendarBoard` renders a horizontally scrollable grid — one column per therapist, rows = time slots.
4. Each `BookingBlock` is absolutely positioned using pixel offsets derived from `start_time` / `end_time`.
5. User actions (create / edit / cancel / check-in) open slide-in panels or modals, submit to the API, then optimistically patch local state so the UI updates instantly without a full refetch.

---

## State Management

Three domain stores + one UI store, all using Zustand:

| Store | Responsibility |
|---|---|
| `authStore` | JWT token, current user, login/logout |
| `bookingStore` | Booking list, filtered views, CRUD actions, optimistic updates |
| `therapistStore` | Therapists, services, rooms, clients |
| `uiStore` | Modal/panel open state, toast notifications |

**Optimistic updates** — on `updateBooking` and `cancelBooking` the store patches `state.bookings` locally and calls `_rebuildIndexes` to refresh `bookingsByTherapist`. This gives instant calendar feedback without waiting for a refetch. The `selectedBooking` reference is also patched so the detail panel reflects changes immediately.

---

## Performance Strategy

- **Virtual rendering** (`@tanstack/react-virtual`) — only the therapist columns currently in the viewport are rendered. This keeps the DOM lean regardless of how many therapists are loaded (tested with 30+, designed for 200+).
- **Code splitting / Lazy loading** (`React.lazy` + `Suspense`) — `CalendarBoard`, `BookingPanel`, `CreateBookingModal`, `EditBookingModal`, `CancelModal`, and `FilterDropdown` are all lazy-loaded. They are excluded from the initial JS bundle and fetched only when first rendered.
- **`React.memo`** on `BookingBlock` and `TherapistColumn` — prevents re-renders when sibling columns change.
- **`useCallback` / `useMemo`** — click handlers and derived data are memoised at the column level.
- **Indexed lookup** — `bookingsById` (Map<id, booking>) and `bookingsByTherapist` (Map<therapistId, booking[]>) are maintained as secondary indexes so each column only reads its own slice of data in O(1).

---

## API Notes

All mutating endpoints (`create`, `update`, `cancel`) require `multipart/form-data`, not JSON. The `items` array is serialised to a JSON string and appended as a single form field. The update endpoint also requires `booking_item_id` inside `items` so the server knows which item record to patch.

Date format sent to the list endpoint: `DD-MM-YYYY / DD-MM-YYYY` (date range, same day for single-day view).

---

## Assumptions

- Single outlet (`outlet: 1`, `company: 1`) — the outlet selector in the UI is read-only.
- A booking has exactly one `booking_item`; the first item found in the `booking_item` object is used.
- `room_items[0].room_id` returned by the API is the bed/item ID, not the room group ID. Room group ID is resolved by reverse-lookup through the rooms list.
- Cancelled bookings are filtered out client-side during normalisation so they do not appear on the calendar.
- Currency is fixed to SGD; `payment_type` defaults to `payatstore`.
- The "Just Delete It" cancel option is blocked when a deposit exists (per business rule shown in the UI).

---

## Getting Started

```bash
npm install
cp .env.example .env   # set REACT_APP_API_BASE_URL and REACT_APP_KEY_PASS
npm start
```
