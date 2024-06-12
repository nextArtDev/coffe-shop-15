import { fetchPosts, fetchPostsInfinitely } from '@/lib/queries/social'
import Post from './Post'
import LoadMore from '../share/LoadMore'

async function Posts() {
  // const posts = await fetchPostsInfinitely({})
  const posts = await fetchPosts()

  return (
    <section>
      <section className="w-full space-y-20 ">
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </section>
      {/* <LoadMore /> */}
    </section>
  )
}

export default Posts
