'use client'

import { cn } from '@/lib/utils'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import UserAvatar from './UserAvatar'

import { UserWithAvatar } from '@/types/definitions'
import { buttonVariants } from '@/components/ui/button'
import { User } from '@prisma/client'

interface ProfileLinkProps {
  user: User & { image: { url: string } | null }
}

function ProfileLink({ user }: ProfileLinkProps) {
  const pathname = usePathname()
  // if (!user) return // I add

  const href = `/social/${user.id}`
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={buttonVariants({
        variant: isActive ? 'secondary' : 'ghost',
        className: 'md:navLink',
        size: 'lg',
      })}
    >
      <UserAvatar
        user={user}
        imgUrl={user.image?.url}
        className={`h-6 w-6 ${isActive && 'border-2 border-white'}`}
      />

      <p
        className={`${cn('hidden lg:block', {
          'font-extrabold': isActive,
        })}`}
      >
        پروفایل
      </p>
    </Link>
  )
}

export default ProfileLink
