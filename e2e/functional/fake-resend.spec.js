import { test, expect } from '../fixtures.js'

test('records sends and fails on demand', async ({ request, fakeResend }) => {
  const send = () => request.post('http://127.0.0.1:8099/emails', { data: { to: 'x@example.com', text: fakeResend.marker } })
  expect((await send()).status()).toBe(200)
  expect(await fakeResend.sent()).toHaveLength(1)
  await fakeResend.failSends()
  expect((await send()).status()).toBe(422)
})
