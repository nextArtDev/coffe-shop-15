import Navbar from './components/nav/Navbar'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="">
      {/* <div className="absolute inset-0 -z-30 bg-gradient-to-t from-orange-950 to-orange-500"> */}
      <Navbar />
      {children}
      {/* </div> */}
    </main>
  )
}
