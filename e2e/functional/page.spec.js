import { test, expect, gotoSettled } from '../fixtures.js'

const PROJECT_LINKS = {
  turbotax: 'https://turbotax.intuit.com/local-tax-offices/ny/new-york/d51a4afe6691489aa78ee8793a6bc278/',
  pickleball: 'https://www.certifiedpickleballplayer.com/',
  guiltyspark: 'https://guiltyspark.builtbybrendan.com/',
}

test('prerendered HTML is complete without JavaScript', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).toContain('I do serious software consulting')
  for (const id of ['id="work"', 'id="about"', 'id="contact"', 'class="contact-form"']) expect(html).toContain(id)
  for (const href of Object.values(PROJECT_LINKS)) expect(html).toContain(`href="${href}"`)
})

test('hydrates and the form becomes interactive', async ({ page }) => {
  await gotoSettled(page)
  await page.locator('form.contact-form [name="name"]').fill('Typed after hydration')
  await expect(page.locator('form.contact-form [name="name"]')).toHaveValue('Typed after hydration')
})

test('project links go to the approved destinations', async ({ page }) => {
  await gotoSettled(page)
  const work = page.locator('#work')
  for (const href of Object.values(PROJECT_LINKS)) await expect(work.locator(`a[href="${href}"]`)).toHaveCount(1)
  await expect(work.locator('a.project-card--contact[href="#contact"]')).toContainText(/Abraham/)
})

test('served files never leak the inbox or the hometown', async ({ request }) => {
  const html = await (await request.get('/')).text()
  const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map(m => m[1])
  expect(scripts.length).toBeGreaterThan(0)
  for (const body of [html, ...(await Promise.all(scripts.map(async s => (await request.get(s)).text())))]) {
    expect(body).not.toContain('mailto:')
    expect(body).not.toContain('test@example.com')
    expect(body).not.toMatch(/poway/i)
  }
})

test('portrait stays a square headshot', async ({ page }, testInfo) => {
  await gotoSettled(page)
  const size = testInfo.project.name === 'desktop' ? 300 : 180
  const box = await page.locator('img[src="/brendan-profile.webp"]').boundingBox()
  expect(Math.round(box.width)).toBe(size)
  expect(Math.round(box.height)).toBe(size)
})

for (const path of ['/robots.txt', '/llms.txt', '/favicon.ico', '/health']) {
  test(`serves ${path}`, async ({ request }) => {
    expect((await request.get(path)).status()).toBe(200)
  })
}
