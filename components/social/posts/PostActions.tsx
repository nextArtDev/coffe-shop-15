import { cn } from '@/lib/utils'
import ActionIcon from '@/components/social/ActionIcon'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import LikeButton from './Like'
import ShareButton from './ShareButton'
import BookmarkButton from './BookmarkButton'
import { PostWithExtras } from '@/types/definitions'
import { TooltipText } from '../share/tooltip'

type Props = {
  post: PostWithExtras
  userId?: string
  className?: string
}

function PostActions({ post, userId, className }: Props) {
  return (
    <div className={cn('relative flex items-start w-full gap-x-2', className)}>
      <LikeButton post={post} userId={userId} />
      <Link href={`/social/p/${post.id}`}>
        <TooltipText text="کامنت‌ها">
          <ActionIcon>
            <MessageCircle className={'h-6 w-6 -rotate-90'} />
          </ActionIcon>
        </TooltipText>
      </Link>
      <ShareButton postId={post.id} />
      <BookmarkButton post={post} userId={userId} />
    </div>
  )
}

export default PostActions
