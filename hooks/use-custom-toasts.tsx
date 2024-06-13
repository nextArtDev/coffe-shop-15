'use client'
import { buttonVariants } from '@/components/ui/button'
// import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

export const useCustomToasts = () => {
  const router = useRouter()
  const loginToast = () => {
    // const { dismiss } = toast({
    //   title: 'وارد حساب کاربری خود شوید.',
    //   description:
    //     'شما برای انجام این عملیات باید عضو شده و وارد حساب کاربری شوید.',
    //   variant: 'destructive',
    //   action: (
    //     <Link
    //       onClick={() => dismiss()}
    //       href="/login"
    //       className={cn(buttonVariants({ variant: 'default' }))}
    //     >
    //       ورود/عضویت
    //     </Link>
    //   ),
    // })
    toast.error('وارد حساب کاربری خود شوید.')
    router.push('/login')
  }

  return { loginToast }
}
