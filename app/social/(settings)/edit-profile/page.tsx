import ProfileForm from '@/components/social/posts/ProfileForm'
import { currentUser } from '@/lib/auth'
import { fetchProfile } from '@/lib/queries/social'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'ویرایش پروفایل',
  description: 'Edit profile',
}

async function EditProfile() {
  // const session = await auth();
  const cUser = await currentUser()
  if (!cUser?.id) return notFound()
  const userId = cUser?.id
  const profile = await fetchProfile(userId)

  if (!profile) {
    notFound()
  }

  return (
    <div className="px-4 sm:px-8 md:px-16 xl:px-20 ">
      <h1 className="text-base sm:text-2xl font-medium">ویرایش پروفایل</h1>

      <ProfileForm profile={profile} />
    </div>
  )
}

export default EditProfile
