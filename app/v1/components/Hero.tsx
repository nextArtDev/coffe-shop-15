'use client'
import { useScroll, useTransform, motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useWindowSize } from '@/hooks/v1/useWindowSize'
import { Button } from '@/components/ui/button'

// const HeroVideos = '/assets/videos/hero.mp4'
// const SmallHeroVideos = '/assets/videos/smallHero.mp4'
const HeroVideos =
  '/v1/videos/Coffee B Roll Daniel Schiffer Inspired Lad3lyizmjs 1371.mp4'
const SmallHeroVideos = '/v1/videos/vid1.mp4'

const Hero = () => {
  // DOES NOT WORK PROPERLY
  const windowSize = useWindowSize()

  const videoContainerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: videoContainerRef,
    offset: ['start start', 'end end'],
  })

  // at 0% -> opacity:1, 70% -> opacity: 1, 100% -> opacity: 0
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0])

  const [videoSrc, setVideoSrc] = useState(
    windowSize.width! < 760 ? SmallHeroVideos : HeroVideos
  )

  const handleVideoSrcSet = useCallback(() => {
    if (windowSize.width! < 760) {
      setVideoSrc(SmallHeroVideos)
    } else {
      setVideoSrc(HeroVideos)
    }
  }, [windowSize.width])

  useEffect(() => {
    window.addEventListener('resize', handleVideoSrcSet)

    return () => {
      window.removeEventListener('resize', handleVideoSrcSet)
    }
  }, [handleVideoSrcSet])

  // useGSAP(() => {
  //   gsap.to('#hero', { opacity: 1, delay: 2 })
  //   gsap.to('#cta', { opacity: 1, y: -50, delay: 2 })
  // }, [])

  return (
    <section className="  ">
      {/* <p
          id="hero"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 hero-title pt-2 "
        >
          کافی فردا
        </p> */}
      {/* <div className="md:w-10/12 w-9/12"> */}
      <motion.div
        style={{ opacity }}
        ref={videoContainerRef}
        className="absolute -z-10 -top-[--header-height] left-0 h-[200vh] w-full  "
      >
        <video
          // className="object-cover  absolute -z-20 inset-0 pointer-events-none"
          className="sticky top-0 h-screen w-full object-cover pointer-events-none -z-20"
          autoPlay
          muted
          loop
          playsInline={true}
          key={videoSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="bg-gradient-to-t from-orange-950 to-orange-500  opacity-25 absolute inset-0 -z-10 " />
      </motion.div>

      {/* <div
        id="cta"
        className="absolute inset-0 top-3/4 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 translate-y-20"
      >
        <Link href="#highlights" className="btn">
          منو
        </Link>
        <p className="font-normal text-xl">خرید آنلاین</p>
      </div> */}
      <article className="mx-auto max-w-[980px] px-6 relative z-10 h-[--hero-height] pb-7">
        <motion.div
          className="flex h-full flex-col items-start justify-end"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
          whileInView="visible"
          exit="hidden"
          animate="hidden"
          viewport={{ amount: 0.7 }}
        >
          <h1
            id="hero"
            className="mb-10 py-6 text-4xl font-bold md:text-5xl hero-title"
          >
            کافی فردا
          </h1>
          <div id="cta" className="py-6 mb-16">
            <Button className="">خرید آنلاین</Button>
            {/* <p className="font-semibold">منو</p> */}
          </div>
        </motion.div>
      </article>
    </section>
  )
}

export default Hero
