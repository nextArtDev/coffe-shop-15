import PostView from '@/components/social/posts/PostView'
import { fetchPostById } from '@/lib/queries/social'

import { notFound } from 'next/navigation'

type Props = {
  params: {
    id: string
  }
}

async function PostModal({ params: { id } }: Props) {
  const post = await fetchPostById(id)

  if (!post) {
    notFound()
  }

  return <PostView id={id} post={post} />
}

export default PostModal
