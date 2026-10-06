import {GithubIcon, LinkedInIcon} from "@/components/icons"
import Clock from "../clock"

interface FooterProps {
  isMobile: boolean
}
const Footer = ({isMobile}: FooterProps) => {
  return (
    <footer className="relative bottom-14 z-0 box-border flex h-[90px] w-full flex-col items-start justify-center p-5 px-10 md:fixed md:flex-row md:items-center lg:bottom-0">
      <nav className="flex w-full flex-row items-start justify-end gap-2.5 md:items-center md:gap-2">
        {!isMobile && <Clock />}
        <a href="/CV-Folio-v2.0.0.pdf" className="p-2 text-xs font-semibold">
          Download Folio
        </a>
        <a
          href="mailto:hello@dallasgale.com"
          className="p-2 text-xs font-semibold"
        >
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
