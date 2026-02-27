import React from "react";
import { Link } from "react-router-dom";

function Documentation() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header-content">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="CLAW" className="logo-image" />
            <span className="logo-text">CLAW</span>
          </Link>

          <nav className="site-nav">
            <Link to="/">Home</Link>
            <Link to="/docs" className="active">Documentation</Link>
            <a href="/#how-it-works">How It Works</a>
            <Link to="/api-keys">API</Link>
          </nav>

          <div className="site-header-actions">
            <a
              href="https://x.com/clawhubscan"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <Link to="/#scan" className="btn-scan-header">Scan Token</Link>
          </div>
        </div>
      </header>

      <div className="docs-page">
        <div className="docs-container">

          <header className="docs-header">
            <h1>CLAW Scanner Documentation</h1>
            <p className="docs-subtitle">
              AI-Powered Token & GitHub Reality Verification
            </p>
          </header>

          <section className="docs-section">
            <h2>What is CLAW Scanner?</h2>
            <p>
              CLAW Scanner is an <strong>AI-powered analysis tool</strong> designed to
              <strong> verify token narratives and GitHub repositories</strong>.
              It helps investors and researchers distinguish between
              <strong> real projects and larp / fake builds</strong>.
            </p>
            <p>
              CLAW combines <strong>real-time market data</strong>,
              <strong> advanced GitHub code analysis</strong>, and
              <strong> AI-driven narrative verification</strong> to detect
              misleading claims in <strong>seconds</strong>.
            </p>
          </section>

          <section className="docs-section">
            <h2>How It Works</h2>

            <div className="docs-step">
              <div className="step-number-doc">1</div>
              <div className="step-content-doc">
                <h3>Data Aggregation</h3>
                <ul>
                  <li><strong>DexScreener</strong> – Market data, liquidity, volume, socials</li>
                  <li><strong>RugCheck</strong> – Security & risk signals</li>
                  <li><strong>GitHub</strong> – Repository structure, commits, activity</li>
                </ul>
              </div>
            </div>

            <div className="docs-step">
              <div className="step-number-doc">2</div>
              <div className="step-content-doc">
                <h3>GitHub Scanner (Core Feature)</h3>
                <p>
                  CLAW deeply analyzes linked GitHub repositories to determine if
                  a project is <strong>real or larp</strong>.
                </p>
                <ul>
                  <li><strong>Is the repository functional?</strong></li>
                  <li><strong>Real code vs boilerplate / copy-paste</strong></li>
                  <li><strong>Commit history & developer activity</strong></li>
                  <li><strong>Dead repos or fake updates detection</strong></li>
                  <li><strong>Malicious patterns or obfuscated logic</strong></li>
                </ul>
                <p>
                  This allows CLAW to expose projects that <strong>pretend to build</strong>
                  but ship no real product.
                </p>
              </div>
            </div>

            <div className="docs-step">
              <div className="step-number-doc">3</div>
              <div className="step-content-doc">
                <h3>Narrative Verification</h3>
                <ul>
                  <li><strong>Claims vs reality</strong></li>
                  <li><strong>Real entities vs fabricated associations</strong></li>
                  <li><strong>Hype detection</strong></li>
                </ul>
              </div>
            </div>

            <div className="docs-step">
              <div className="step-number-doc">4</div>
              <div className="step-content-doc">
                <h3>Risk Assessment</h3>
                <ul>
                  <li>Fake GitHub or empty repos</li>
                  <li>Malicious or suspicious code</li>
                  <li>Unverifiable claims</li>
                  <li>Inactive or abandoned development</li>
                </ul>
              </div>
            </div>

          </section>

          <section className="docs-section">
            <h2>Verdicts</h2>

            <div className="verdict-card">
              <div className="verdict-header verdict-confirmed">
                <h3>CONFIRMED</h3>
              </div>
              <p>
                Narrative references <strong>real events</strong> and the
                <strong> GitHub repository is functional and active</strong>.
              </p>
            </div>

            <div className="verdict-card">
              <div className="verdict-header verdict-partial">
                <h3>PARTIAL</h3>
              </div>
              <p>
                Some claims are real, but <strong>code quality, activity or scope
                is exaggerated</strong>.
              </p>
            </div>

            <div className="verdict-card">
              <div className="verdict-header verdict-unverified">
                <h3>UNVERIFIED</h3>
              </div>
              <p>
                <strong>No functional GitHub</strong>, fake repos,
                larp development or unverifiable claims.
              </p>
            </div>
          </section>

          <section className="docs-section">
            <h2>Data Sources</h2>

            <div className="source-grid">
              <div className="source-card">
                <h3>GitHub Scanner</h3>
                <p>
                  Deep inspection of repositories to detect
                  <strong> fake projects, malicious code, and inactive builds</strong>.
                </p>
                <a
                  href="https://github.com/clawhubscan"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View GitHub →
                </a>
              </div>

              <div className="source-card">
                <h3>DexScreener</h3>
                <p>Market data and social discovery</p>
                <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer">
                  Visit →
                </a>
              </div>

              <div className="source-card">
                <h3>OpenAI</h3>
                <p>AI reasoning & narrative classification</p>
                <a href="https://openai.com" target="_blank" rel="noopener noreferrer">
                  Visit →
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>

      <footer className="app-footer">
        <div className="app-footer-content">
          <div className="app-footer-logo">
            <img src="/logo.png" alt="CLAW" className="footer-logo-image" />
          </div>

          <div className="app-footer-links">
            <Link to="/">Home</Link>
            <Link to="/docs">Documentation</Link>
            <a href="https://www.clawhubscan.xyz/" target="_blank" rel="noopener noreferrer">Website</a>
            <a href="https://github.com/clawhubscan" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>

          <div className="app-footer-text">
            Built with React • OpenAI • GitHub Intelligence • Always Verify
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Documentation;