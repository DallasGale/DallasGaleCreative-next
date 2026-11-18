"use client"
import About from "@components/about"
import BackgroundGradient from "@src/components/background-gradient"
import Footer from "@src/components/footer"
import Header from "@src/components/header"
import Intro from "@src/components/intro"
import RecentWork from "@src/components/recent-work"
import ThemeToggle from "@src/components/theme-toggle"
import useMobile from "@src/hooks/useMobile"

export default function Home() {
  const isMobile = useMobile()
  return (
    <>
      <BackgroundGradient />
      <Header />
      <ThemeToggle />
      <main className="relative z-1 mx-auto flex flex-col">
        <Intro />
        <RecentWork isMobile={isMobile} />
        <About />
        <Footer isMobile={isMobile} />
      </main>
    </>
  )
}
