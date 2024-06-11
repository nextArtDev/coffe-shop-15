import EditPost from '@/components/social/posts/EditPost'
import { fetchPostById } from '@/lib/queries/social'

import { notFound } from 'next/navigation'

type Props = {
  params: {
    id: string
  }
}

async function EditPostPage({ params: { id } }: Props) {
  const post = await fetchPostById(id)

  if (!post) {
    notFound()
  }

  return <EditPost id={id} post={post} />
}

export default EditPostPage
