import './globals.css'
import './mdb.css'
import Script from 'next/script'
import Indicate from "./components/indicator"
export const viewport = {
  initialScale: 1,
  width: 'device-width'
}
export const metadata = {
  title: 'EXAMPLE-A - HTML, CSS, Javascript, React Js, Angular Js, Vue Js, Appscript, Google, Stackoverflow,Next Js and More.',
  description: "EXAMPLE-A is a dynamic web application crafted with Next.js, a React-based framework, designed to provide users with efficient solutions to coding challenges whenever needed. Leveraging the power of Next.js, this web app offers a seamless and responsive experience for users seeking instant and effective code solutions.",
  keywords:"HTML, CSS, Javascript, React Js, Angular Js, Vue Js, Appscript, Google, Stackoverflow,Next Js",
  robots:"noodp",
  alternates: {
    canonical: `https://example-a.com`
    
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Indicate/>
        {children}
        <Script src="/custom.js" id="cstmjs"></Script>
        <Script type="application/ld+json" src='/jsonld.json'></Script>
{/* <Script src="/y1.js"></Script> */}
{/* <Script src="https://yandex.ru/ads/system/context.js" async></Script> */}
{/* <Script src="/y2.js"></Script> */}
        </body>
    </html>
  )
}
