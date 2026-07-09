import { GithubIcon, LinkedInIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="site-footer relative z-[2] box-border flex h-[120px] w-full flex-col items-start justify-between p-5 md:sticky md:flex-row md:items-end">
      <nav className="flex w-full flex-row items-start gap-2.5 md:items-center md:gap-5">
        <a
          href="https://github.com/dallasgale"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="footer-nav-icon h-6 w-6"
        >
          <GithubIcon />
        </a>
        <a
          href="https://www.linkedin.com/in/dallas-gale/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="footer-nav-icon h-6 w-6"
        >
          <LinkedInIcon />
        </a>
      </nav>

      <div className="flex w-full flex-row justify-start gap-5 md:justify-end">
        <a href="/CV-Folio.pdf" className="footer-cta p-2.5 text-sm font-semibold">
          Download Folio
        </a>
        <a
          href="mailto:hello@dallasgale.com"
          className="footer-cta p-2.5 text-sm font-semibold"
        >
          Contact Me
        </a>
      </div>
    </footer>
  );
}
