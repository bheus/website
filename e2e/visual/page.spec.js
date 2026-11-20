import { test, expectBaseline, gotoSettled, allowFailures } from '../fixtures.js'
import { fillContact, submitContact, formStatus, validContact } from '../helpers.js'
import { expect } from '@playwright/test'

test('full page', async ({ page }) => {
  await gotoSettled(page)
  await expectBaseline(page, 'full-page.png', { fullPage: true })
})

test('contact sent', async ({ page, fakeResend }) => {
  await gotoSettled(page)
  await fillContact(page, validContact(fakeResend.marker))
  await submitContact(page)
  await expect(formStatus(page)).toHaveText(/on its way/)
  await expectBaseline(page.locator('#contact'), 'contact-sent.png')
})

test('contact failed', async ({ page, fakeResend }) => {
  allowFailures(page, [{ path: '/api/contact', status: 502 }])
  await fakeResend.failSends()
  await gotoSettled(page)
  await fillContact(page, validContact(fakeResend.marker))
  await submitContact(page)
  await expect(formStatus(page)).toHaveText(/could not be delivered/)
  await expectBaseline(page.locator('#contact'), 'contact-failed.png')
})
