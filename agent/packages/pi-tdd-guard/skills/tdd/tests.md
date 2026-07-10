# Good and Bad Tests

## Behavior-facing test

```typescript
test("user can checkout with a valid cart", async () => {
  const cart = createCart();
  cart.add(product);

  const result = await checkout(cart, paymentMethod);

  expect(result.status).toBe("confirmed");
});
```

This test exercises a public capability, describes what matters to a caller, and can survive internal refactoring.

## Implementation-coupled test

```typescript
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);

  await checkout(cart, payment);

  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

This test describes internal collaboration. It can fail when implementation changes even if checkout behavior remains correct.

Prefer observing the result through the public interface:

```typescript
test("created user can be retrieved", async () => {
  const user = await createUser({ name: "Alice" });

  const retrieved = await getUser(user.id);

  expect(retrieved.name).toBe("Alice");
});
```

## Tautological test

```typescript
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, item) => sum + item.price, 0);

  expect(calculateTotal(items)).toBe(expected);
});
```

The expected value repeats the calculation under test. Use an independent known result:

```typescript
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
});
```
