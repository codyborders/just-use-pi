# Mocking Boundaries

Mock systems the project does not control. Typical boundaries include external APIs, clocks, randomness, transports, persistent stores, and the filesystem. Prefer a real test store or temporary directory when practical. Exercise project-owned classes and modules through a public seam instead of mocking their internal collaboration.

Prefer narrow boundary interfaces:

```typescript
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}
```

Avoid generic boundary wrappers whose mocks need their own routing logic:

```typescript
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

Prefer operation-specific interfaces instead:

```typescript
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch("/orders", { method: "POST", body: data }),
};
```

Each mock should represent one external operation with one clear result shape. Assertions should cover project behavior through the chosen seam.
