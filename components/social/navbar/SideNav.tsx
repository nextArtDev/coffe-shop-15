import { currentUser } from '@/lib/auth'
import Logo from './Logo'
import MoreDropdown from './MoreDropdown'
import NavLinks from './NavLinks'
import ProfileLink from './ProfileLink'
import { getUserById } from '@/lib/queries/auth/user'

async function SideNav() {
  const cUser = await currentUser()
  if (!currentUser) return

  const userId = cUser?.id

  const user = await getUserById(userId)
  // const user = session
  // console.log(user)

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <div className="border-t -mr-3 md:ml-0  h-16 justify-evenly fixed z-50 flex-1 w-full md:relative md:h-full bottom-0 md:border-none flex flex-row md:justify-between gap-x-2 md:flex-col md:gap-x-0 md:gap-y-2 p-2 backdrop-blur-md ">
        <Logo />
        <NavLinks />
        {!!user && (
          <>
            <ProfileLink user={user} />
            <div className="md:hidden">
              <MoreDropdown />
            </div>
          </>
        )}

        <div className="hidden md:flex relative md:mt-auto flex-1 items-end w-full">
          <MoreDropdown />
        </div>
      </div>
    </div>
  )
}

export default SideNav
