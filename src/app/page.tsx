"use client"
import BackgroundGradient from "@/components/background-gradient"
import Employers from "@/components/employers"
import Footer from "@/components/footer"
import Header from "@/components/header"
import Intro from "@/components/intro"
import RecentWork from "@/components/recent-work"
import ScrollEffects from "@/components/scroll-effects"
import useMobile from "@/hooks/useMobile"

export default function Home() {
  const isMobile = useMobile()
  return (
    <>
      <BackgroundGradient />
      <Header />
      <main className="relative z-0 mx-auto flex flex-col">
        <Intro />
        {!isMobile && <RecentWork />}
        <Employers />
        {/* <About /> */}
        {/* <h3 className="color-white mt-20 h-50 text-center text-2xl font-extrabold md:mb-20 md:text-8xl">
          Thanks for visiting.
        </h3> */}
      </main>
      <Footer />
      <ScrollEffects />
    </>
  )
}
