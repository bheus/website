import React, { useRef, useState } from "react"
import "./styles/site.css"

const Arrow = () => (
  <svg viewBox="0 0 18 18" aria-hidden="true">
    <path d="M4 14 14 4M6 4h8v8" />
  </svg>
)

const LocationMark = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 18s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
    <circle cx="10" cy="8" r="2" />
  </svg>
)

const Landscape = () => (
  <div className="landscape" aria-hidden="true">
    <div className="sun" />
    <svg className="hills hills--back" viewBox="0 0 1440 360" preserveAspectRatio="none">
      <path d="M0 250c140-42 222-128 360-116 107 9 148 72 254 66 131-7 197-132 351-123 159 9 209 130 475 126v157H0Z" />
    </svg>
    <svg className="hills hills--front" viewBox="0 0 1440 300" preserveAspectRatio="none">
      <path d="M0 215c213 38 290-86 469-73 153 12 218 104 375 95 164-9 241-105 596-74v137H0Z" />
      <path className="trail" d="M1212 163C1208 176 1226 184 1222 195 1217 210 1180 220 1150 235 1110 255 1020 278 965 300H1155C1170 280 1195 258 1210 235 1225 212 1252 208 1248 195 1244 182 1222 174 1218 163Z" />
    </svg>
  </div>
)

const TurboTaxVisual = () => (
  <div className="project-visual turbotax-visual" aria-hidden="true">
    <div className="browser-bar"><i /><i /><i /></div>
    <div className="tt-content">
      <div className="tt-map">
        <span className="map-road map-road--one" />
        <span className="map-road map-road--two" />
        <span className="map-pin map-pin--one">●</span>
        <span className="map-pin map-pin--two">●</span>
        <span className="map-pin map-pin--three">●</span>
      </div>
      <div className="tt-list">
        <span className="mini-label">LOCAL TAX HELP</span>
        <strong>An easy way to find an expert nearby</strong>
        <span className="skeleton skeleton--long" />
        <span className="skeleton skeleton--short" />
      </div>
    </div>
  </div>
)

const PickleballVisual = () => (
  <div className="project-visual pickleball-visual" aria-hidden="true">
    <div className="court-lines" />
    <div className="paddle">
      <span className="paddle-mark">C</span>
      <span className="paddle-handle" />
    </div>
    <div className="pickleball">
      <i /><i /><i /><i /><i />
    </div>
    <span className="certified-stamp">PLAYER<br />CERTIFIED</span>
  </div>
)

const AbrahamVisual = () => (
  <div className="project-visual abraham-visual" aria-hidden="true">
    <div className="chart-head">
      <span>ABRAHAM / 01</span>
      <span className="research-pill">SYSTEMATIC</span>
    </div>
    <div className="chart-value">$2.47M <small>SIMULATED EQUITY</small></div>
    <svg viewBox="0 0 600 190" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d0a160" stopOpacity=".36" />
          <stop offset="1" stopColor="#d0a160" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="chart-area" d="M0 167 38 159 74 164 111 144 145 149 181 124 217 131 258 99 292 110 328 86 366 92 400 56 440 72 479 41 519 48 560 19 600 8V190H0Z" />
      <path className="chart-line" d="M0 167 38 159 74 164 111 144 145 149 181 124 217 131 258 99 292 110 328 86 366 92 400 56 440 72 479 41 519 48 560 19 600 8" />
    </svg>
  </div>
)

const GuiltySparkVisual = () => (
  <div className="project-visual guiltyspark-visual" aria-hidden="true">
    <div className="terminal-top">
      <span><i /><i /><i /></span>
      <em>guiltyspark / monitor</em>
      <span className="live"><b /> LIVE</span>
    </div>
    <div className="terminal-lines">
      <p><span>21:42:08</span> Watching service logs...</p>
      <p><span>21:42:11</span> <b className="warn">Anomaly detected</b> in checkout-api</p>
      <p><span>21:42:12</span> Root cause isolated <b className="ok">✓</b></p>
      <p><span>21:42:14</span> Patch generated &amp; verified <b className="ok">✓</b></p>
    </div>
    <div className="terminal-footer"><span>AUTONOMOUS FIX READY</span><b>Review →</b></div>
  </div>
)

const ProjectCard = ({ eyebrow, title, description, href, linkLabel, children, className = "" }) => {
  const Tag = href ? "a" : "article"
  const externalProps = href
    ? { href, ...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {}) }
    : {}

  return (
    <li className="project-item">
      <Tag className={`project-card ${className}`} {...externalProps}>
        <span className="project-eyebrow">{eyebrow}</span>
        {children}
        <div className="project-copy">
          <h3>{title}</h3>
          <p>{description}</p>
          <span className="project-link">{linkLabel} <Arrow /></span>
        </div>
      </Tag>
    </li>
  )
}

const solveChallenge = async nonce => {
  const encoder = new TextEncoder()
  const batchSize = 256

  for (let start = 0; start < 65536; start += batchSize) {
    const proofs = Array.from({ length: batchSize }, (_, offset) => start + offset)
    const digests = await Promise.all(
      proofs.map(proof => crypto.subtle.digest("SHA-256", encoder.encode(`${nonce}:${proof}`)))
    )
    const match = digests.findIndex(buffer => {
      const digest = new Uint8Array(buffer)
      return digest[0] === 0 && digest[1] < 16
    })

    if (match !== -1) return String(proofs[match])
  }

  throw new Error("Unable to verify this browser")
}

const ContactForm = () => {
  const challengeRef = useRef(null)
  const challengePromiseRef = useRef(null)
  const [status, setStatus] = useState({ type: "idle", message: "" })

  const prepareChallenge = () => {
    if (challengeRef.current) return Promise.resolve(challengeRef.current)
    if (challengePromiseRef.current) return challengePromiseRef.current

    challengePromiseRef.current = fetch("/api/contact/challenge", {
      headers: { Accept: "application/json" },
    })
      .then(response => {
        if (!response.ok) throw new Error("Contact service unavailable")
        return response.json()
      })
      .then(challenge => {
        challengeRef.current = challenge
        return challenge
      })
      .finally(() => {
        challengePromiseRef.current = null
      })

    return challengePromiseRef.current
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setStatus({ type: "working", message: "Checking and sending…" })

    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form).entries())

    try {
      const challenge = await prepareChallenge()
      const proof = await solveChallenge(challenge.nonce)
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...fields, nonce: challenge.nonce, proof }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) throw new Error(result.message || "Message could not be sent")

      form.reset()
      challengeRef.current = null
      setStatus({ type: "success", message: "Thanks — your message is on its way." })
    } catch (error) {
      challengeRef.current = null
      setStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      })
    }
  }

  return (
    <form
      className="contact-form"
      aria-label="Contact Brendan"
      onSubmit={handleSubmit}
      onFocus={() => prepareChallenge().catch(() => {})}
      onPointerDown={() => prepareChallenge().catch(() => {})}
    >
      <p className="section-kicker form-kicker">Go on, tell me</p>
      <div className="form-row">
        <label>
          <span>Your name</span>
          <input type="text" name="name" autoComplete="name" maxLength="100" required />
        </label>
        <label>
          <span>Your email</span>
          <input type="email" name="email" autoComplete="email" maxLength="200" required />
        </label>
      </div>
      <label>
        <span>Your company <em>optional</em></span>
        <input type="text" name="company" autoComplete="organization" maxLength="120" />
      </label>
      <label>
        <span>Your project</span>
        <textarea name="message" rows="5" minLength="20" maxLength="5000" required />
      </label>
      <label className="form-trap" aria-hidden="true">
        <span>Website</span>
        <input type="text" name="website" tabIndex="-1" autoComplete="off" />
      </label>
      <div className="form-submit-row">
        <button className="button button--light" type="submit" disabled={status.type === "working"}>
          {status.type === "working" ? "Sending…" : "Send it"} <Arrow />
        </button>
        <p className={`form-status form-status--${status.type}`} aria-live="polite">
          {status.message}
        </p>
      </div>
      <p className="form-note">Protected against automated submissions. Your details are only used to reply.</p>
    </form>
  )
}

export default function App() {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BH — Brendan Heussler, home">
          <span className="brand-mark">BH</span>
          <span className="brand-name">Brendan Heussler</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a className="nav-contact" href="#contact">Contact <Arrow /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <Landscape />
          <div className="hero-inner">
            <div className="hero-kicker reveal reveal--one">
              <span className="hero-kicker-dot" />
              Engineering · Systems · Automation
            </div>
            <h1 id="hero-title" className="reveal reveal--two">I do serious software consulting <em>for&nbsp;fun.</em></h1>
            <p className="hero-lede reveal reveal--three">
              I’m Brendan, a full-stack engineer obsessed with making software that doesn’t need hand-holding. So I launch seaworthy apps—and sometimes actual boats—in and around San Diego, CA.
            </p>
            <div className="hero-actions reveal reveal--four">
              <a className="button button--primary" href="#contact">Work with me <Arrow /></a>
              <a className="text-link" href="#work">Explore my work <span>↓</span></a>
            </div>
          </div>
        </section>

        <ul className="intro-band" aria-label="What I do">
          <li>Product engineering</li>
          <li>Scalable web platforms</li>
          <li>AI &amp; automation</li>
          <li>Technical strategy</li>
        </ul>

        <section className="work-section" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">What I work on</span>
              <h2 id="work-title">Web platforms of all sizes<br />for real people of all kinds.</h2>
            </div>
            <p>I build everything from high-traffic customer interfaces to hyper-focused personal experiences. And what I care about most is making every one feel flawless.</p>
          </div>

          <div className="work-group">
            <div className="group-label">Projects I’ve led</div>
            <ul className="project-grid">
              <ProjectCard
                eyebrow="Intuit · Store locator"
                title="Behind the scenes of national storefronts."
                description="What you see: a discovery platform for hundreds of TurboTax stores and thousands of expert profiles. What you don’t: the data that powers it."
                href="https://turbotax.intuit.com/local-tax-offices/ny/new-york/d51a4afe6691489aa78ee8793a6bc278/"
                linkLabel="See the site"
                className="project-card--wide"
              >
                <TurboTaxVisual />
              </ProjectCard>

              <ProjectCard
                eyebrow="Certified Pickleball"
                title="A place for athletes to meet their match."
                description="This is the hub that gives pickleball players what every fanatic wants: personalized gear, AI-powered match analyses, community access, and proof they’re at the top of their game."
                href="https://www.certifiedpickleballplayer.com/"
                linkLabel="Tour the court"
              >
                <PickleballVisual />
              </ProjectCard>
            </ul>
          </div>

          <div className="work-group work-group--personal">
            <div className="group-label">Platforms I’ve built</div>
            <ul className="project-grid project-grid--reverse">
              <ProjectCard
                eyebrow="Abraham · Trading"
                title="A trading system that shows its work."
                description="Backed by reproducible research and disciplined risk controls, this algorithm uses evidence to beat (basically) every hunch—and, in historical testing, the S&amp;P&nbsp;500."
                href="#contact"
                linkLabel="Ask for details"
                className="project-card--contact"
              >
                <AbrahamVisual />
              </ProjectCard>

              <ProjectCard
                eyebrow="AI Operations"
                title="The log monitor that fixes what it finds."
                description="With the help of an autonomous engineering agent that watches production logs, finds bugs in context, and corrects errors on sight, you can finally close your eyes."
                href="https://guiltyspark.builtbybrendan.com/"
                linkLabel="Check it out"
                className="project-card--wide"
              >
                <GuiltySparkVisual />
              </ProjectCard>
            </ul>
          </div>
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="about-photo-wrap">
            <div className="about-photo-bg" />
            <img src="/brendan-profile.webp" width="900" height="900" alt="Illustrated portrait of Brendan Heussler" />
            <span className="photo-sun" aria-hidden="true" />
          </div>
          <div className="about-copy">
            <span className="section-kicker">A bit about me</span>
            <h2 id="about-title">A full-stack engineer for your wildest projects.</h2>
            <p className="about-lede">My friends call me Moose. And when your project is a bear, you need big ideas.</p>
            <p>That’s why I spend my time building software with the kind of strength, speed, and stealth that’ll surprise you.</p>
            <p className="section-kicker values-kicker">Rules I play by</p>
            <ul className="about-values">
              <li><strong>Look good</strong><p>I think the systems we’re happiest to ship, run, and trust are the ones that are easiest on the eyes.</p></li>
              <li><strong>Go fast</strong><p>Making consistent, thoughtful decisions can make even the most complex projects feel uncomplicated.</p></li>
              <li><strong>Hold tight</strong><p>I pay attention to the details that seem small, but add up to a structure scalable products can stand on.</p></li>
            </ul>
          </div>
        </section>

        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <div className="contact-landscape" aria-hidden="true">
            <span className="contact-sun" />
            <span className="contact-hill contact-hill--one" />
            <span className="contact-hill contact-hill--two" />
          </div>
          <div className="contact-grid">
            <div className="contact-copy">
              <span className="section-kicker">Contact me</span>
              <h2 id="contact-title">Let’s build the software <em>of&nbsp;your&nbsp;dreams.</em></h2>
              <p>Tell me a little about the knot you’re trying to untangle, the product you can’t stop thinking about, or the idea you just know the world needs. I’ll take you seriously.</p>
              <span className="contact-location"><LocationMark /> Based in California · Working with you</span>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">BH</span><span className="brand-name">Brendan Heussler</span></a>
        <p>Software consultant · San Diego, California</p>
        <div>
          <a href="https://github.com/bheus" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#contact">Contact</a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </>
  )
}
