# API Client & Generated Types

This project ships an OpenAPI-driven client to keep the frontend and backend contracts in sync.

## Package layout

- `packages/api/` – pnpm workspace package that contains:
  - `src/schema.ts` generated via `openapi-typescript`.
  - `src/api.ts` exporting the `ApiClient` class plus helper types.
  - `package.json` script `pnpm --filter @salonbw/api gen:api` to regenerate types from `backend/salonbw-backend/openapi.json`.

The package is published inside the workspace as `@salonbw/api` and consumed by the frontend.

## Generating types

Whenever backend endpoints change, re-run:

```bash
pnpm --filter salonbw-backend swagger:generate   # optional – refresh openapi.json
pnpm --filter @salonbw/api gen:api               # regenerate schema.ts
```

Commit the updated `packages/api/src/schema.ts` so other developers see the new contracts.

## Using the client

```ts
import { ApiClient } from '@salonbw/api';

const api = new ApiClient(
  () => accessToken,     // getter for the current JWT
  handleLogout,          // called when the refresh flow fails
  applyTokens            // optional – called when tokens are refreshed
);

const profile = await api.requestTyped({
  path: '/users/profile',
  method: 'get',
});
```

`requestTyped` infers request/response types automatically from the OpenAPI schema. The classic `request(endpoint, init?)` overload remains available when a quick call is sufficient.

The client automatically:

- Adds the `Authorization` header when a token is present.
- Sends `credentials: 'include'` for cookie-based flows.
- Attempts to refresh tokens on `401` responses (`/auth/refresh`) and retries the original request.
- Throws `ServiceUnavailableException` style errors with status codes for easier handling in the UI.

## React Query integration

The frontend now wraps `useList` and associated hooks (appointments, services, products) with TanStack Query:

- `useAppointments()` reads the `['api', '/appointments']` key.
- Mutations in `useAppointmentsApi()` call `.invalidateQueries({ queryKey: ['api', '/appointments'] })` after success.

When writing new hooks:

1. Import the relevant response/request types from `@salonbw/api`.
2. Use `useQuery` / `useMutation` and reuse the shared query keys.
3. Expose helper constants so other modules can invalidate the same cache entries.

Example mutation pattern:

```ts
const queryClient = useQueryClient();

const createAppointment = useMutation({
  mutationFn: (payload: CreateAppointmentPayload) =>
    apiFetch<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  onSuccess: () => {
    toast.success('Appointment created');
    queryClient.invalidateQueries({ queryKey: APPOINTMENTS_QUERY_KEY });
  },
});
```

## Troubleshooting

- Ensure `NEXT_PUBLIC_API_URL` is set before instantiating `ApiClient`; it defaults to `http://localhost`.
- If new routes appear in the backend but not in TypeScript, regenerate the schema (see above).
- Jest tests that use hooks should wrap renders with a `QueryClientProvider`; see `src/__tests__/hooksList.test.tsx` for a helper.
