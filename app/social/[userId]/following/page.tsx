import FollowingModal from '@/components/social/posts/FollowingModal'
import { fetchProfile } from '@/lib/queries/social'

async function FollowingPage({
  params: { userId },
}: {
  params: {
    userId: string
  }
}) {
  const profile = await fetchProfile(userId)
  const following = profile?.following

  return <FollowingModal following={following} userId={userId} />
}

export default FollowingPage
