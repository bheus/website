// The server rejects a submission less than 2.5 s after its challenge was issued.
// It measures real time, so the wait has to be real too.
const MIN_FORM_TIME_MS = 2600

export const validContact = marker => ({
  name: 'Test Person',
  email: 'person@example.com',
  company: 'Example Co',
  message: `Hello there, this is an integration test message. ${marker}`,
})

/** Fill the contact form; focusing it fetches the proof-of-work challenge. */
export async function fillContact(page, fields) {
  const form = page.locator('form.contact-form')
  const challenge = page.waitForResponse('**/api/contact/challenge')
  for (const [name, value] of Object.entries(fields)) {
    await form.locator(`[name="${name}"]`).fill(value, { force: name === 'website' })
  }
  await challenge
}

/** Submit the form and return the /api/contact response. */
export async function submitContact(page, { waitForTimingCheck = true } = {}) {
  if (waitForTimingCheck) await page.waitForTimeout(MIN_FORM_TIME_MS)
  const response = page.waitForResponse('**/api/contact')
  await page.getByRole('button', { name: 'Send it' }).click()
  return response
}

export const formStatus = page => page.locator('.form-status')
