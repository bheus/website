import { test, expect } from '@playwright/test'

test('health', async ({ request }) => {
  expect((await request.get('/health')).status()).toBe(200)
})
