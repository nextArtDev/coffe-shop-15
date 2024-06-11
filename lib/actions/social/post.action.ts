'use server'

import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

import {
  BookmarkSchema,
  CreateComment,
  CreatePost,
  DeleteComment,
  DeletePost,
  LikeSchema,
  UpdatePost,
} from '@/lib/schemas/social/schemas'
import { z } from 'zod'
import { currentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFileFromS3, uploadFileToS3 } from '../s3Upload'

interface CreatePostParams {
  errors: {
    caption?: string[]
    fileUrls?: string[]
    _form?: string[]
  }
}
export async function createPost(
  formData: FormData
): Promise<CreatePostParams> {
  const result = CreatePost.safeParse({
    caption: formData.get('caption'),
    fileUrls: formData.getAll('fileUrls'),
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }
  // console.log(result.data.caption)
  // console.log(result.data.fileUrls)

  const user = await currentUser()
  if (!user?.id) {
    return {
      errors: {
        _form: ['برای این کار باید به حساب کاربری خود وارد شوید.'],
      },
    }
  }

  const userId = user.id

  try {
    let imageIds: string[] = []
    for (let img of result.data.fileUrls) {
      const buffer = Buffer.from(await img.arrayBuffer())
      const res = await uploadFileToS3(buffer, img.name)

      if (res?.imageId && typeof res.imageId === 'string') {
        imageIds.push(res.imageId)
      }
    }
    await prisma.post.create({
      data: {
        userId,
        caption: result.data.caption,
        fileUrl: {
          connect: imageIds.map((id) => ({
            id,
          })),
        },
      },
    })
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      }
    } else {
      return {
        errors: {
          _form: ['مشکلی پیش آمده، لطفا دوباره امتحان کنید!'],
        },
      }
    }
  }
  // try {
  //   const newPost = await prisma.post.create({
  //     data: {
  //       caption,
  //       userId,
  //     },
  //   })

  revalidatePath('/social/create')
  redirect('/social')
  //   return newPost
  // } catch (error) {
  //   console.log(error)
  // }
}
// interface CreatePostParams {
//   caption?: string
// }
// export async function createPost(params: CreatePostParams) {
//   const { caption } = params

//   const user = await currentUser()
//   if (!user?.id) return

//   const userId = user.id

//   try {
//     const newPost = await prisma.post.create({
//       data: {
//         caption,
//         userId,
//       },
//     })

//     revalidatePath('/social/create')
//     return newPost
//   } catch (error) {
//     console.log(error)
//   }
// }

interface DeletePostParams {
  errors: {
    id?: string[]
    _form?: string[]
  }
}

export async function deletePost(
  formState: DeletePostParams,
  formData: FormData
): Promise<DeletePostParams> {
  const cUser = await currentUser()

  const result = DeletePost.safeParse({
    id: formData.get('id'),
  })
  console.log(result.success)
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }

  // if (!currentUser || currentUser.role !== 'ADMIN') return
  if (!cUser) {
    return {
      errors: {
        _form: ['برای این کار باید به حساب کاربری خود وارد شوید.'],
      },
    }
  }

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: result.data.id,
        userId: cUser.id,
      },
      include: {
        fileUrl: { select: { id: true, key: true } },
      },
    })

    if (!post) {
      return {
        errors: {
          _form: ['این پست حذف شده است.'],
        },
      }
    }

    if (post.fileUrl) {
      for (let image of post.fileUrl) {
        if (image.key) {
          await deleteFileFromS3(image.key)
        }
      }
    }

    await prisma.post.delete({
      where: { id: result.data.id },
    })
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      }
    } else {
      return {
        errors: {
          _form: ['مشکلی پیش آمده، لطفا دوباره امتحان کنید!'],
        },
      }
    }
  }
  revalidatePath('/social')
  redirect('/social')
}

export async function likePost(value: FormDataEntryValue | null) {
  // const userId = await getUserId()
  const user = await currentUser()
  if (!user?.id) return
  const userId = user.id

  const validatedFields = LikeSchema.safeParse({ postId: value })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'خطا، لایک ناموفق!',
    }
  }

  const { postId } = validatedFields.data

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  })

  if (!post) {
    throw new Error('پست پیدا نشد!')
  }

  const like = await prisma.like.findUnique({
    where: {
      // Because @unique([postId, userId]) in prisma model
      postId_userId: {
        postId,
        userId,
      },
    },
  })

  if (like) {
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
      revalidatePath('/social')
      return { message: 'لایک برداشته شد.' }
    } catch (error) {
      return { message: 'خطا در شبکه!' }
    }
  }

  try {
    await prisma.like.create({
      data: {
        postId,
        userId,
      },
    })
    return { message: 'پست لایک شد.' }
  } catch (error) {
    return { message: 'خطای شبکه، لطفا دوباره امتحان کنید!' }
  } finally {
    revalidatePath('/social')
  }
}

export async function bookmarkPost(value: FormDataEntryValue | null) {
  // const userId = await getUserId()
  const user = await currentUser()
  if (!user?.id) return
  const userId = user.id

  const validatedFields = BookmarkSchema.safeParse({ postId: value })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'خطا! ذخیره ناموفق.',
    }
  }

  const { postId } = validatedFields.data

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  })

  if (!post) {
    throw new Error('پست پیدا نشد!')
  }

  const bookmark = await prisma.savedPost.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  })

  if (bookmark) {
    try {
      await prisma.savedPost.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })
      revalidatePath('/social')
      return { message: 'از ذخیره خارج شد.' }
    } catch (error) {
      return {
        message: 'خطای شبکه! ناموفق در ذخیره پست.',
      }
    }
  }

  try {
    await prisma.savedPost.create({
      data: {
        postId,
        userId,
      },
    })
    revalidatePath('/social')
    return { message: 'پست ذخیره شد.' }
  } catch (error) {
    return {
      message: 'خطای شبکه! لطفا دوباره امتحان کنید.',
    }
  }
}

export async function createComment(values: z.infer<typeof CreateComment>) {
  // const userId = await getUserId()
  const user = await currentUser()
  if (!user?.id) redirect('/login')
  const userId = user.id

  const validatedFields = CreateComment.safeParse(values)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'ارسال کامنت ناموفق بود! دوباره امتحان کنید.',
    }
  }

  const { postId, body } = validatedFields.data

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  })

  if (!post) {
    throw new Error('پست حذف شده است.')
  }

  try {
    await prisma.comment.create({
      data: {
        body,
        postId,
        userId,
      },
    })
    revalidatePath('/social')
    // return { message: 'کامنت ارسال شد.' }
  } catch (error) {
    return { message: 'خطا در شبکه! لطفا بعدا امتحان کنید.' }
  }
}

export async function deleteComment(formData: FormData) {
  // const userId = await getUserId()
  const user = await currentUser()
  if (!user?.id) return
  const userId = user.id

  const { id } = DeleteComment.parse({
    id: formData.get('id'),
  })

  const comment = await prisma.comment.findUnique({
    where: {
      id,
      userId,
    },
  })

  if (!comment) {
    throw new Error('کامنت یافت نشد!')
  }

  try {
    await prisma.comment.delete({
      where: {
        id,
      },
    })
    revalidatePath('/social')
    return { message: 'کامنت حذف شد!' }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      }
    } else {
      return {
        errors: {
          _form: ['مشکلی پیش آمده، لطفا دوباره امتحان کنید!'],
        },
      }
    }
  }
}

interface UpdatePostParams {
  errors: {
    caption?: string[]
    _form?: string[]
  }
}

export async function updatePost(
  formData: FormData
): Promise<UpdatePostParams> {
  const result = UpdatePost.safeParse({
    caption: formData.get('caption'),
    id: formData.get('id'),
  })
  console.log(result.success)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }
  console.log('result', result.data.caption)
  console.log(result.data.id)
  const user = await currentUser()
  if (!user?.id) {
    return {
      errors: {
        _form: ['برای این کار باید به حساب کاربری خود وارد شوید.'],
      },
    }
  }
  const userId = user.id

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: result.data.id,
        userId,
      },
    })

    if (!post) {
      return {
        errors: {
          _form: ['پست حذف شده است.'],
        },
      }
    }
    await prisma.post.update({
      where: {
        id: result.data.id,
      },
      data: {
        // fileUrl,
        caption: result.data.caption,
      },
    })
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      }
    } else {
      return {
        errors: {
          _form: ['مشکلی پیش آمده، لطفا دوباره امتحان کنید!'],
        },
      }
    }
  }
  redirect('/social')
}
