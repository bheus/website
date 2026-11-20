import { test, expect, gotoSettled, allowFailures } from '../fixtures.js'
import { fillContact, submitContact, formStatus, validContact } from '../helpers.js'

test.use({ baseURL: 'http://127.0.0.1:8081' })

test('says delivery is unavailable instead of faking success', async ({ page, fakeResend }) => {
  allowFailures(page, [{ path: '/api/contact', status: 503 }])
  await gotoSettled(page)
  await fillContact(page, validContact(fakeResend.marker))
  expect((await submitContact(page)).status()).toBe(503)
  await expect(formStatus(page)).toHaveText('Contact delivery is temporarily unavailable.')
})
