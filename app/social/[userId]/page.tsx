import PostsGrid from "@/components/social/posts/PostsGrid"
import { fetchPostsByUserId } from "@/lib/queries/social"

 
async function ProfilePage({
  params: { userId },
}: {
  params: { userId: string }
}) {
  const posts = await fetchPostsByUserId(userId)

  return <PostsGrid posts={posts} />
}

export default ProfilePage
