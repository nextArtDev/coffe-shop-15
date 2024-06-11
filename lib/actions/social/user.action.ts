'use server'

import { revalidatePath } from 'next/cache'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  FollowUser,
  UpdatePicture,
  UpdateUser,
} from '@/lib/schemas/social/schemas'
import { currentUser } from '@/lib/auth'

import { redirect } from 'next/navigation'
import { deleteFileFromS3, uploadFileToS3 } from '../s3Upload'

export async function followUser(formData: FormData) {
  //   const userId = await getUserId()
  const cUser = await currentUser()
  if (!cUser?.id) return
  const userId = cUser.id

  const { id } = FollowUser.parse({
    id: formData.get('id'),
  })

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const follows = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        // followerId is of the person who wants to follow
        followerId: userId,
        // followingId is of the person who is being followed
        followingId: id,
      },
    },
  })

  if (follows) {
    try {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: id,
          },
        },
      })
      revalidatePath('/social')
      return { message: 'کاربر آنفالو شد.' }
    } catch (error) {
      return {
        message: 'Database Error: Failed to Unfollow User.',
      }
    }
  }

  try {
    await prisma.follows.create({
      data: {
        followerId: userId,
        followingId: id,
      },
    })
    revalidatePath('/social')
    return { message: 'کاربر فالو شد.' }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Follow User.',
    }
  }
}

export async function updateProfile(values: z.infer<typeof UpdateUser>) {
  const cUser = await currentUser()
  if (!cUser?.id) return
  const userId = cUser.id

  const validatedFields = UpdateUser.safeParse(values)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Profile.',
    }
  }

  const { bio, gender, image, name, username, website } = validatedFields.data

  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        username,
        name,
        bio,
        gender,
        website,
      },
    })
    // await prisma.image.updateMany({
    //   where: { userId },
    //   data: {
    //     url: image,
    //   },
    // })
    revalidatePath('/social/edit-profile')
    return { message: 'پروفایل اپدیت شد.' }
  } catch (error) {
    return { message: 'Database Error: Failed to Update Profile.' }
  }
}

interface UpdatePictureFormState {
  success?: string
  errors: {
    image?: string[]
    id?: string[]

    _form?: string[]
  }
}
export async function updatePicture(
  formData: FormData
): Promise<UpdatePictureFormState> {
  const result = UpdatePicture.safeParse({
    image: formData.get('image'),
    id: formData.get('id'),
  })

  if (!result.success) {
    console.log(result.error.flatten().fieldErrors)
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }

  const cUser = await currentUser()

  if (!cUser?.id || cUser.id !== result.data.id) {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  const userId = cUser.id

  const { image } = result.data

  try {
    const isExisting = await prisma.user.findFirst({
      where: {
        id: result.data.id,
      },
      include: {
        image: true,
      },
    })

    if (!isExisting) {
      return {
        errors: {
          _form: ['این کاربر وجود ندارد!'],
        },
      }
    }
    if (isExisting.image?.url) {
      await deleteFileFromS3(isExisting.image.key)
    }

    if (result.data?.image instanceof File) {
      let imageId: string = ''
      const file = result.data.image as File
      const buffer = Buffer.from(await file.arrayBuffer())
      const res = await uploadFileToS3(buffer, file.name)

      if (res?.imageId && typeof res.imageId === 'string') {
        imageId = res.imageId
        // Use the imageId as needed
      }

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          image: {
            connect: { id: imageId },
          },
        },
      })
    }
    // await prisma.image.updateMany({
    //   where: { userId },
    //   data: {
    //     url: image,
    //   },
    // })
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

  revalidatePath('/social/edit-profile')
  redirect(`/social/${result.data.id}`)
}
