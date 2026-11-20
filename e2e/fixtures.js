import { test as base, expect } from '@playwright/test'

const FAKE_RESEND = 'http://127.0.0.1:8099'
// Keeps the footer's copyright year stable in screenshots.
const FROZEN_AT = new Date('2026-06-15T12:00:00-07:00')

const allowances = new WeakMap()
const usedBaselines = new Set()

export const recordedBaselines = () => usedBaselines

/** Declare API failures or console errors this test expects to see. */
export function allowFailures(page, matchers) {
  allowances.get(page)?.push(...matchers)
}

const matches = (pattern, value) => (pattern instanceof RegExp ? pattern.test(value) : pattern === value)

function isAllowed(allowed, { path, status, console: text }) {
  return allowed.some(rule =>
    text !== undefined
      ? rule.console && matches(rule.console, text)
      : rule.path && matches(rule.path, path) && (rule.status === undefined || rule.status === status),
  )
}

/** toHaveScreenshot that records its baseline, so a full run can find unused ones. */
export async function expectBaseline(target, name, options) {
  const info = base.info()
  usedBaselines.add(info.snapshotPath(name, { kind: 'screenshot' }))
  await expect(target).toHaveScreenshot(name, options)
}

export async function gotoSettled(page, path = '/') {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
}

let ipCounter = 0

export const test = base.extend({
  // The server allows five submissions per IP per hour and trusts X-Forwarded-For,
  // so a distinct address per test keeps tests from spending each other's quota.
  forwardedFor: async ({}, use, testInfo) => {
    ipCounter += 1
    await use(`10.${testInfo.workerIndex % 250}.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`)
  },

  extraHTTPHeaders: async ({ forwardedFor }, use) => {
    await use({ 'X-Forwarded-For': forwardedFor })
  },

  fakeResend: async ({ request }, use, testInfo) => {
    const marker = `e2e-${testInfo.testId}-${testInfo.repeatEachIndex}`
    await use({
      marker,
      sent: async () => (await request.get(`${FAKE_RESEND}/__sent?marker=${marker}`)).json(),
      failSends: async () => { await request.post(`${FAKE_RESEND}/__fail?marker=${marker}`) },
    })
  },

  page: async ({ page }, use) => {
    const allowed = []
    allowances.set(page, allowed)
    const problems = []

    page.on('console', message => {
      if (message.type() !== 'error') return
      const text = message.text()
      // A failed fetch also logs this line; the response check below judges it.
      if (text.startsWith('Failed to load resource')) return
      if (!isAllowed(allowed, { console: text })) problems.push(`console error: ${text}`)
    })
    page.on('pageerror', error => problems.push(`page error: ${error.message}`))
    page.on('response', response => {
      const url = new URL(response.url())
      if (response.status() < 400) return
      if (!isAllowed(allowed, { path: url.pathname, status: response.status() })) {
        problems.push(`${response.status()} from ${url.pathname}`)
      }
    })

    await page.clock.setFixedTime(FROZEN_AT)
    await use(page)
    expect(problems, 'unexpected errors while the test ran').toEqual([])
  },
})

export { expect }
