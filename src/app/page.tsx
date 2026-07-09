import BackgroundGradient from "@/components/BackgroundGradient";
import Header from "@/components/Header";
import Intro from "@/components/Intro";
import About from "@/components/About";
import RecentWork from "@/components/RecentWork";
import Footer from "@/components/Footer";
import ScrollEffects from "@/components/ScrollEffects";

export default function Home() {
  return (
    <>
      <BackgroundGradient />
      <Header />
      <main className="mx-auto flex flex-col p-5 md:p-0">
        <Intro />
        <About />
        <RecentWork />
      </main>
      <Footer />
      <ScrollEffects />
    </>
  );
}
