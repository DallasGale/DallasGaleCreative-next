import BackgroundGradient from "@/components/BackgroundGradient"
import Header from "@/components/Header"
import Intro from "@/components/Intro"
import About from "@/components/About"
import RecentWork from "@/components/RecentWork"
import Footer from "@/components/Footer"
import ScrollEffects from "@/components/ScrollEffects"

export default function Home() {
  return (
    <>
      <BackgroundGradient />
      <Header />
      <main className="z-0 relative mx-auto flex flex-col p-5 xl:p-0">
        <Intro />
        {/* <About /> */}
        <RecentWork />

        <h3 className="text-2xl md:text-8xl color-white font-extrabold text-center md:mb-20 h-50 mt-20">
          Thanks for visiting.
        </h3>
      </main>
      <Footer />
      <ScrollEffects />
    </>
  )
}
