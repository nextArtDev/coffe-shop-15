import PostsGrid from '@/components/social/posts/PostsGrid'
import { fetchSavedPostsByUserId } from '@/lib/queries/social'

async function SavedPosts({
  params: { userId },
}: {
  params: { userId: string }
}) {
  const savedPosts = await fetchSavedPostsByUserId(userId)
  const posts = savedPosts?.map((savedPost) => savedPost.post)

  return <PostsGrid posts={posts} />
}

export default SavedPosts
