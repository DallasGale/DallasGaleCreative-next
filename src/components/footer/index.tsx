import {GithubIcon, LinkedInIcon} from "@/components/icons"
import Clock from "../clock"
import Employers from "../employers"

interface FooterProps {
  isMobile: boolean
}
const Footer = ({isMobile}: FooterProps) => {
  return (
    <footer className="fixed right-0 bottom-0 z-40 box-border flex h-auto w-full flex-col items-start justify-center backdrop-blur-md md:items-center">
      <Employers />

      <div className="relative flex w-full items-center justify-center border-b-1 border-[var(--site-text-color)] p-4">
        <p className="flex text-center text-sm font-bold text-[var(--site-text-color)] xl:text-sm">
          Some of the amazing agencies, start-ups and organisations I have been
          part of.
        </p>
      </div>
      <nav className="flex w-full flex-row items-center justify-center gap-2.5 p-4 md:gap-2">
        {!isMobile && <Clock />}
        <a href="/CV-Folio-v2.0.0.pdf" className="text-xs font-semibold">
          Download Folio
        </a>
        <a href="mailto:hello@dallasgale.com" className="text-xs font-semibold">
          Contact Me
        </a>
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
    </footer>
  )
}

export default Footer
