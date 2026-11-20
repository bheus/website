import { test, expect, gotoSettled, allowFailures } from '../fixtures.js'
import { fillContact, submitContact, formStatus, validContact } from '../helpers.js'

test.beforeEach(async ({ page }) => { await gotoSettled(page) })

test('sends a message', async ({ page, fakeResend }) => {
  await fillContact(page, validContact(fakeResend.marker))
  expect((await submitContact(page)).status()).toBe(200)
  await expect(formStatus(page)).toHaveText('Thanks — your message is on its way.')
  const sent = await fakeResend.sent()
  expect(sent).toHaveLength(1)
  expect([sent[0].to].flat()).toEqual(['test@example.com'])
  expect(JSON.stringify(sent[0])).toContain('this is an integration test message')
})

test('reports a delivery failure honestly', async ({ page, fakeResend }) => {
  allowFailures(page, [{ path: '/api/contact', status: 502 }])
  await fakeResend.failSends()
  await fillContact(page, validContact(fakeResend.marker))
  expect((await submitContact(page)).status()).toBe(502)
  await expect(formStatus(page)).toHaveText('The message could not be delivered. Please try again later.')
})

test('honeypot submissions are silently dropped', async ({ page, fakeResend }) => {
  await fillContact(page, { ...validContact(fakeResend.marker), website: 'https://spam.example' })
  expect((await submitContact(page)).status()).toBe(200)
  expect(await fakeResend.sent()).toHaveLength(0)
})

test('too-fast submissions are rejected', async ({ page, fakeResend }) => {
  allowFailures(page, [{ path: '/api/contact', status: 400 }])
  await fillContact(page, validContact(fakeResend.marker))
  expect((await submitContact(page, { waitForTimingCheck: false })).status()).toBe(400)
  await expect(formStatus(page)).toHaveText('This browser could not be verified. Please try again.')
  expect(await fakeResend.sent()).toHaveLength(0)
})

test('empty required fields never reach the server', async ({ page }) => {
  let posted = false
  page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith('/api/contact')) posted = true })
  await page.getByRole('button', { name: 'Send it' }).click()
  await page.waitForTimeout(500)
  expect(posted).toBe(false)
})

test('five sends from one visitor stay within the rate limit', async ({ page, fakeResend }) => {
  test.setTimeout(60_000)
  for (let i = 0; i < 5; i += 1) {
    await fillContact(page, validContact(fakeResend.marker))
    expect((await submitContact(page)).status()).toBe(200)
    await expect(formStatus(page)).toHaveText('Thanks — your message is on its way.')
  }
  expect(await fakeResend.sent()).toHaveLength(5)
})
