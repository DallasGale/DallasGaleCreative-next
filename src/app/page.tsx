"use client"
import About from "@components/about"
import BackgroundGradient from "@/components/background-gradient"
import Footer from "@/components/footer"
import Header from "@/components/header"
import Intro from "@/components/intro"
import RecentWork from "@/components/recent-work"
import ThemeToggle from "@/components/theme-toggle"
import useMobile from "@/hooks/useMobile"

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
