import FollowersModal from '@/components/social/posts/FollowersModal'
import { fetchProfile } from '@/lib/queries/social'

async function FollowersPage({
  params: { userId },
}: {
  params: {
    userId: string
  }
}) {
  const profile = await fetchProfile(userId)
  const followers = profile?.followedBy

  return <FollowersModal followers={followers} userId={userId} />
}

export default FollowersPage
