// import { followUser } from "@/lib/actions";
import { followUser } from '@/lib/actions/social/user.action'
import SubmitButton from './SubmitButton'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

function FollowButton({
  profileId,
  isFollowing,
  className,
  buttonClassName,
}: {
  profileId: string
  isFollowing?: boolean
  className?: string
  buttonClassName?: string
}) {
  return (
    <form action={followUser} className={className}>
      <input type="hidden" value={profileId} name="id" />
      <SubmitButton
        className={buttonVariants({
          variant: isFollowing ? 'secondary' : 'default',
          className: cn('!font-bold w-full', buttonClassName),
          size: 'sm',
        })}
      >
        {isFollowing ? 'آنفالو' : 'فالو'}
      </SubmitButton>
    </form>
  )
}

export default FollowButton
