import React, { useRef, useState } from "react"
import { Helmet } from "react-helmet"
import "../styles/site.css"

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
    </svg>
    <div className="trail" />
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
        <strong>Find an expert nearby</strong>
        <span className="skeleton skeleton--long" />
        <span className="skeleton skeleton--short" />
        <span className="tt-button">Schedule</span>
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

const ProjectCard = ({ number, eyebrow, title, description, href, linkLabel, children, className = "" }) => {
  const Tag = href ? "a" : "article"
  const externalProps = href
    ? { href, ...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {}) }
    : {}

  return (
    <Tag className={`project-card ${className}`} {...externalProps}>
      <div className="project-card__top">
        <span className="project-number">{number}</span>
        <span className="project-eyebrow">{eyebrow}</span>
      </div>
      {children}
      <div className="project-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="project-link">{linkLabel} <Arrow /></span>
      </div>
    </Tag>
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
      onSubmit={handleSubmit}
      onFocus={() => prepareChallenge().catch(() => {})}
      onPointerDown={() => prepareChallenge().catch(() => {})}
    >
      <div className="form-row">
        <label>
          <span>Name</span>
          <input type="text" name="name" autoComplete="name" maxLength="100" required />
        </label>
        <label>
          <span>Your email</span>
          <input type="email" name="email" autoComplete="email" maxLength="200" required />
        </label>
      </div>
      <label>
        <span>Company <em>optional</em></span>
        <input type="text" name="company" autoComplete="organization" maxLength="120" />
      </label>
      <label>
        <span>What are you working on?</span>
        <textarea name="message" rows="5" minLength="20" maxLength="5000" required />
      </label>
      <label className="form-trap" aria-hidden="true">
        <span>Website</span>
        <input type="text" name="website" tabIndex="-1" autoComplete="off" />
      </label>
      <div className="form-submit-row">
        <button className="button button--light" type="submit" disabled={status.type === "working"}>
          {status.type === "working" ? "Sending…" : "Send message"} <Arrow />
        </button>
        <p className={`form-status form-status--${status.type}`} aria-live="polite">
          {status.message}
        </p>
      </div>
      <p className="form-note">Protected against automated submissions. Your details are only used to reply.</p>
    </form>
  )
}

export default function HomePage() {
  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Brendan Heussler — Software Consultant in San Diego</title>
        <meta name="description" content="Independent software consultant in San Diego. Brendan Heussler builds resilient web products, scalable platforms, and practical automation." />
        <meta name="theme-color" content="#f4efe4" />
        <meta property="og:title" content="Brendan Heussler — Software Consultant" />
        <meta property="og:description" content="Serious software. Easygoing process. Built in San Diego, California." />
        <meta property="og:type" content="website" />
      </Helmet>

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
        <section className="hero">
          <Landscape />
          <div className="hero-inner">
            <div className="availability reveal reveal--one">
              <span className="availability-dot" />
              Product engineering · Systems · Automation
            </div>
            <h1 className="reveal reveal--two">Serious software.<br /><em>Easygoing process.</em></h1>
            <p className="hero-lede reveal reveal--three">
              I’m Brendan, a software consultant who turns complicated systems into products that feel simple, fast, and dependable.
            </p>
            <div className="hero-actions reveal reveal--four">
              <a className="button button--primary" href="#contact">Tell me what you’re building <Arrow /></a>
              <a className="text-link" href="#work">See selected work <span>↓</span></a>
            </div>
          </div>
          <div className="hero-location reveal reveal--four"><LocationMark /> San Diego, California</div>
        </section>

        <section className="intro-band" aria-label="What I do">
          <span>Product engineering</span><i />
          <span>Scalable web platforms</span><i />
          <span>AI &amp; automation</span><i />
          <span>Technical strategy</span>
        </section>

        <section className="work-section" id="work">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Selected work</span>
              <h2>Built for people.<br />Engineered to scale.</h2>
            </div>
            <p>From high-traffic customer experiences to focused products, I care about the invisible details that make software hold up.</p>
          </div>

          <div className="work-group">
            <div className="group-label"><span>01</span> Professional work</div>
            <div className="project-grid">
              <ProjectCard
                number="01"
                eyebrow="Intuit · TurboTax"
                title="Local tax help, at national scale."
                description="A scalable local discovery platform for hundreds of TurboTax stores and thousands of expert profiles—connecting customers with trusted tax help nearby."
                href="https://turbotax.intuit.com/local-tax-offices/ny/new-york/d51a4afe6691489aa78ee8793a6bc278/"
                linkLabel="View a live location"
                className="project-card--wide"
              >
                <TurboTaxVisual />
              </ProjectCard>

              <ProjectCard
                number="02"
                eyebrow="Certified Pickleball Player"
                title="A digital home for a fast-growing sport."
                description="A player platform combining verified credentials, personalized gear, community discovery, and AI-powered match analysis."
                href="https://www.certifiedpickleballplayer.com/"
                linkLabel="Visit the product"
              >
                <PickleballVisual />
              </ProjectCard>
            </div>
          </div>

          <div className="work-group work-group--personal">
            <div className="group-label"><span>02</span> Personal work</div>
            <div className="project-grid project-grid--reverse">
              <ProjectCard
                number="03"
                eyebrow="Abraham · Trading Algorithm"
                title="A trading algorithm built on evidence, not instinct."
                description="An algorithmic trading system that beats the S&amp;P 500 in historical testing, backed by reproducible research and disciplined risk controls."
                href="#contact"
                linkLabel="Contact me to learn more"
                className="project-card--contact"
              >
                <AbrahamVisual />
              </ProjectCard>

              <ProjectCard
                number="04"
                eyebrow="GuiltySpark · AI Operations"
                title="The log monitor that fixes what it finds."
                description="An autonomous engineering agent that watches production logs, finds bugs in context, and turns incidents into tested fixes."
                href="https://guiltyspark.builtbybrendan.com/"
                linkLabel="Explore GuiltySpark"
                className="project-card--wide"
              >
                <GuiltySparkVisual />
              </ProjectCard>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-photo-wrap">
            <div className="about-photo-bg" />
            <img src="/brendan-profile.webp" width="900" height="900" alt="Illustrated portrait of Brendan Heussler" />
            <span className="photo-sun" aria-hidden="true" />
          </div>
          <div className="about-copy">
            <span className="section-kicker">A little about me</span>
            <h2>Calm thinking for complicated builds.</h2>
            <p className="about-lede">I’m a full-stack engineer and consultant based in San Diego, California.</p>
            <p>I’ve spent my career building software people depend on—from customer experiences at Intuit to lean, ambitious products. I’m at my best when the problem is messy, the stakes are real, and the path forward needs equal parts technical depth and common sense.</p>
            <div className="about-values">
              <div><span>01</span><strong>Clear over clever</strong><p>Simple systems are easier to ship, run, and trust.</p></div>
              <div><span>02</span><strong>Steady under pressure</strong><p>No drama. Just thoughtful decisions and consistent progress.</p></div>
              <div><span>03</span><strong>Built to last</strong><p>Good architecture should create options, not obligations.</p></div>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-landscape" aria-hidden="true">
            <span className="contact-sun" />
            <span className="contact-hill contact-hill--one" />
            <span className="contact-hill contact-hill--two" />
          </div>
          <div className="contact-grid">
            <div className="contact-copy">
              <span className="section-kicker">Contact me</span>
              <h2>Let’s make something<br /><em>solid and useful.</em></h2>
              <p>Tell me a little about the project, the knot you’re trying to untangle, or the idea you can’t quite leave alone.</p>
              <span className="contact-location"><LocationMark /> San Diego · Working with good people everywhere</span>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">BH</span><span className="brand-name">Brendan Heussler</span></a>
        <p>Software consultant · San Diego, California</p>
        <div>
          <a href="https://github.com/moose-byte" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#contact">Contact</a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </>
  )
}
