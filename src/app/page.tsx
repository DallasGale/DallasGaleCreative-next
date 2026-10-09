"use client"
import BackgroundGradient from "@/components/background-gradient"
import Employers from "@/components/employers"
import Footer from "@/components/footer"
import Header from "@/components/header"
import Intro from "@/components/intro"
import RecentWork from "@/components/recent-work"
import ScrollEffects from "@/components/scroll-effects"
import SideSquares from "@/components/side-squares"
import ThemeToggle from "@/components/theme-toggle"
import useMobile from "@/hooks/useMobile"
import About from "@components/about"

export default function Home() {
  const isMobile = useMobile()
  return (
    <>
      <BackgroundGradient />
      <Header />
      {/* <SideSquares /> */}
      <ThemeToggle />
      <main className="relative z-1 mx-auto flex flex-col">
        <Intro />
        <RecentWork isMobile={isMobile} />
        {/* <Employers /> */}
        <About />
        <Footer isMobile={isMobile} />
      </main>
      {/* <ScrollEffects /> */}
    </>
  )
}
