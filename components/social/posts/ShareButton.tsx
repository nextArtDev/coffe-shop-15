'use client'

import ActionIcon from '@/components/social/ActionIcon'
import { Link, Send } from 'lucide-react'
import { toast } from 'sonner'

function ShareButton({ postId }: { postId: string }) {
  return (
    <ActionIcon
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/social/p/${postId}`
        )
        toast.success('لینک کپی شد', {
          icon: <Link className={'h-5 w-5 '} />,
        })
      }}
    >
      <Send className={'h-6 w-6 -rotate-90'} />
    </ActionIcon>
  )
}

export default ShareButton
