import ImageSlider from '@/components/ImageSlider'
import { PostWithExtras } from '@/types/definitions'
import { HeartIcon, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function PostsGrid({ posts }: { posts: PostWithExtras[] | undefined }) {
  if (posts?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-y-3 max-w-3xl lg:max-w-4xl mx-auto pb-20">
        <p className="font-semibold text-sm text-neutral-400">
          پست‌های بیشتری وجود ندارد.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts?.map((post) => {
        const imageUrls: string[] = []
        const validImageUrls = post.fileUrl.flatMap(({ url }) => [
          ...imageUrls,
          url,
        ])
        return (
          <Link
            href={`/social/p/${post.id}`}
            key={post.id}
            className="relative flex items-center justify-center h-[182px] sm:h-64 lg:h-80 group col-span-1"
          >
            <ImageSlider
              urls={validImageUrls}
              className="-z-10 transition group-hover:filter group-hover:blur-[2px] group-hover:brightness-90"
            />
            <div className="z-20  opacity-0 group-hover:opacity-100 flex flex-col transition items-center justify-center gap-4">
              {post.likes.length > 0 && (
                <div className="flex items-center font-bold gap-x-1">
                  <HeartIcon className="text-white fill-white" />
                  <p className="text-white">{post.likes.length}</p>
                </div>
              )}

              {post.comments.length > 0 && (
                <div className="flex items-center font-bold gap-x-1">
                  <MessageCircle className="text-white fill-white" />
                  <p className="text-white">{post.comments.length}</p>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default PostsGrid
