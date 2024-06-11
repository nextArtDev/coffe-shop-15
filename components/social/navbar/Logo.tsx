import { buttonVariants } from '@/components/ui/button'
import { Coffee } from 'lucide-react'
import Link from 'next/link'

function Logo() {
  return (
    <Link
      href={'/social'}
      className={buttonVariants({
        className:
          'hidden md:flex navLink !mb-10 lg:hover:bg-transparent lg:!p-0',
        variant: 'ghost',
        size: 'lg',
      })}
    >
      <Coffee className="h-6 w-6 shrink-0 lg:hidden" />
      <p className={`font-semibold text-xl hidden lg:block $ `}>کافی‌گرام</p>
    </Link>
  )
}

export default Logo
