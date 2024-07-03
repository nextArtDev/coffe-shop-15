'use client'
import Image from 'next/image'

import CoffeeIcon from '@/public/v1/images/tea-cup.png'
import SearchImage from '@/public/v1/images/search.svg'
import BagImage from '@/public/v1/images/bag.svg'
import { navLists } from '@/constants/v1'
import Link from 'next/link'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useEffect, useState } from 'react'
import StickyNav from './StickyNav'

let clamp = (number: number, min: number, max: number) =>
  Math.min(Math.max(number, min), max)

function useBoundedScroll(bounds: number) {
  let { scrollY } = useScroll()
  let scrollYBounded = useMotionValue(0)
  let scrollYBoundedProgress = useTransform(scrollYBounded, [0, bounds], [0, 1])

  useEffect(() => {
    return scrollY.onChange((current) => {
      let previous = scrollY.getPrevious() || 0
      let diff = current - previous
      let newScrollYBounded = scrollYBounded.get() + diff

      scrollYBounded.set(clamp(newScrollYBounded, 0, bounds))
    })
  }, [bounds, scrollY, scrollYBounded])

  return { scrollYBounded, scrollYBoundedProgress }
}

const Navbar = () => {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  })

  let [activeTab, setActiveTab] = useState(navLists[0].id)
  let { scrollYBoundedProgress } = useBoundedScroll(400)
  let scrollYBoundedProgressThrottled = useTransform(
    scrollYBoundedProgress,
    [0, 0.85, 1],
    [0, 0, 1]
  )
  return (
    <>
      <motion.header
        className="fixed inset-0 h-16 w-full z-50  sm:px-10 px-5 flex justify-between items-center"
        style={{
          height: useTransform(
            scrollYBoundedProgressThrottled,
            [0, 1],
            // [max , min] height
            [70, 50]
          ),
          backgroundColor: useMotionTemplate`rgb(255 255 255 / ${useTransform(
            scrollYBoundedProgressThrottled,
            [0, 1],
            [0.1, 0.5]
          )})`,
        }}
      >
        <nav className="flex flex-col w-full pt-4 screen-max-width">
          <div className="flex justify-between items-center ">
            <Link href={'/'}>
              <motion.figure
                style={{
                  scale: useTransform(
                    scrollYBoundedProgressThrottled,
                    [0, 1],
                    // [max , min] height
                    [1, 1.3]
                  ),
                }}
              >
                <Image src={CoffeeIcon} alt="Apple" width={24} height={24} />
              </motion.figure>
            </Link>

            <div className="flex items-baseline gap-7 max-sm:justify-end max-sm:flex-1">
              <motion.figure
                style={{
                  scale: useTransform(
                    scrollYBoundedProgressThrottled,
                    [0, 1],
                    // [max , min] height
                    [1, 1.3]
                  ),
                }}
              >
                <Image src={SearchImage} alt="search" width={18} height={18} />
              </motion.figure>

              <motion.figure
                style={{
                  scale: useTransform(
                    scrollYBoundedProgressThrottled,
                    [0, 1],
                    // [max , min] height
                    [1, 1.3]
                  ),
                }}
              >
                <Image src={BagImage} alt="bag" width={18} height={18} />
              </motion.figure>
            </div>
          </div>
          <motion.ul
            onMouseLeave={() => {
              setPosition((pv) => ({
                ...pv,
                opacity: 0,
              }))
            }}
            className=" flex flex-1 py-1 justify-center  max-sm:hidden "
          >
            {navLists.map((nav) => (
              <motion.li
                key={nav.id}
                className="px-5 text-sm cursor-pointer text-gray hover:text-white transition-all"
                style={{
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  opacity: useTransform(
                    scrollYBoundedProgressThrottled,
                    [0, 1],
                    [1, 0]
                  ),
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  height: useTransform(
                    scrollYBoundedProgressThrottled,
                    [0, 1],
                    // [max , min] height
                    [30, 10]
                  ),
                }}
              >
                {nav.link}
              </motion.li>
            ))}
          </motion.ul>
        </nav>
      </motion.header>
      <div className="flex space-x-1">
        <div className=" ">
          <StickyNav>
            {navLists.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id ? '' : 'hover:text-background'
                } relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground bg-transparent  transition focus-visible:outline-2`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  borderRadius: 9999,
                }}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="bubble"
                    className="absolute inset-0 z-10 bg-white mix-blend-difference"
                    style={{ borderRadius: 9999 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.link}
              </button>
            ))}
          </StickyNav>
        </div>
      </div>
    </>
  )
}

export default Navbar
