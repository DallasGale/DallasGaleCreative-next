"use client"
import useMobile from "@src/hooks/useMobile"
import BackgroundGradient from "@src/components/background-gradient"
import Footer from "@src/components/footer"
import Header from "@src/components/header"
import ThemeToggle from "@src/components/theme-toggle"

interface Props {
  children: React.ReactNode
}
const Layout = ({children}: Props) => {
  const isMobile = useMobile()
  return (
    <>
      <BackgroundGradient />
      <Header />
      <ThemeToggle />
      <main className="relative z-1 mx-auto flex flex-col">
        {children}
        <Footer isMobile={isMobile} />
      </main>
    </>
  )
}

export default Layout
