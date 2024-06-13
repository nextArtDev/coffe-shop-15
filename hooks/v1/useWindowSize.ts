'use client'

import { useEffect, useState } from 'react'

export function useWindowSize() {
  // const [windowSize, setWindowSize] = useState({
  //   width: undefined,
  //   height: undefined,
  // })
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined
    height: number | undefined
  }>({
    width: undefined,
    height: undefined,
  })
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return windowSize
}
