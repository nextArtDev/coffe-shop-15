'use client'

import { cn } from '@/lib/utils'
import ActionIcon from '@/components/social/ActionIcon'
import { SavedPost } from '@prisma/client'
import { Bookmark } from 'lucide-react'
import { useOptimistic } from 'react'
import { PostWithExtras } from '@/types/definitions'
import { bookmarkPost } from '@/lib/actions/social/post.action'
import { TooltipText } from '../share/tooltip'

type Props = {
  post: PostWithExtras
  userId?: string
}

function BookmarkButton({ post, userId }: Props) {
  const predicate = (bookmark: SavedPost) =>
    bookmark.userId === userId && bookmark.postId === post.id
  const [optimisticBookmarks, addOptimisticBookmark] = useOptimistic<
    SavedPost[]
  >(
    post.savedBy,
    // @ts-ignore
    (state: SavedPost[], newBookmark: SavedPost) =>
      state.find(predicate)
        ? //   here we check if the bookmark already exists, if it does, we remove it, if it doesn't, we add it
          state.filter((bookmark) => bookmark.userId !== userId)
        : [...state, newBookmark]
  )

  return (
    <form
      action={async (formData: FormData) => {
        const postId = formData.get('postId')
        addOptimisticBookmark({ postId, userId })
        await bookmarkPost(postId)
      }}
      className="mr-auto"
    >
      <input type="hidden" name="postId" value={post.id} />

      <ActionIcon>
        <TooltipText text="ذخیره">
          <Bookmark
            className={cn('h-6 w-6', {
              'dark:fill-white fill-black': optimisticBookmarks.some(predicate),
            })}
          />
        </TooltipText>
      </ActionIcon>
    </form>
  )
}

export default BookmarkButton
