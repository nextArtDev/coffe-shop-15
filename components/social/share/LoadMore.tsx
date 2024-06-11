'use client'

import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { startTransition, useEffect, useRef, useState } from 'react'

import { fetchPosts, fetchPostsInfinitely } from '@/lib/queries/social'
import { PostWithExtras } from '@/types/definitions'
import Post from '../posts/Post'

let page = 2

function LoadMore() {
  const { ref, inView } = useInView()

  const [data, setData] = useState<PostWithExtras[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pageRef = useRef<number>(1)

  useEffect(() => {
    if (inView) {
      // window.alert('2')
      setIsLoading(true)
      // Add a delay of 500 milliseconds
      const delay = 500

      const fetchData = async () => {
        try {
          const newPosts = await fetchPostsInfinitely({
            page: pageRef.current,
            limit: 6,
          })
          setData((data) => [...data, ...newPosts.data])
          console.log(newPosts)
          pageRef.current += 1

          setIsLoading(false)
        } catch (error) {
          console.error('Error fetching posts:', error)
        }
      }
      fetchData()
    }
  }, [inView])

  return (
    <>
      <section className="w-full space-y-20 ">
        {data.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </section>
      <section className="flex justify-center items-center w-full">
        <div ref={ref}>
          {inView && (
            <Image
              src="./spinner.svg"
              alt="spinner"
              width={56}
              height={56}
              className="object-contain"
            />
          )}
        </div>
      </section>
    </>
  )
}

export default LoadMore
