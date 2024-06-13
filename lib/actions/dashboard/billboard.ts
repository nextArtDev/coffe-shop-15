'use server'

import { auth } from '@/auth'

import { prisma } from '../../prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Billboard, Image, Store } from '@prisma/client'

import { deleteFileFromS3, uploadFileToS3 } from './s3Upload'
import { createBillboardSchema } from '@/lib/schemas/dashboard/billboard'

interface CreateBillboardFormState {
  errors: {
    label?: string[]
    images?: string[]
    _form?: string[]
  }
}
export async function createBillboard(
  formData: FormData,
  storeId: string,
  path: string
): Promise<CreateBillboardFormState> {
  const result = createBillboardSchema.safeParse({
    label: formData.get('label'),
    images: formData.getAll('images'),
  })

  // console.log(result)
  // console.log(formData.getAll('images'))

  if (!result.success) {
    // console.log(result.error.flatten().fieldErrors)
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }
  const session = await auth()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  if (!storeId) {
    return {
      errors: {
        _form: ['فروشگاه در دسترس نیست!'],
      },
    }
  }

  // const storeByUserId = await prisma.store.findFirst({
  //   where: {
  //     id: storeId,
  //     userId: session.user.id,
  //   },
  // })
  // if (!storeByUserId) {
  //   return {
  //     errors: {
  //       _form: ['شما اجازه دسترسی ندارید!'],
  //     },
  //   }
  // }

  // console.log(result)

  let billboard: Billboard
  try {
    const isExisting = await prisma.billboard.findFirst({
      where: { label: result.data.label, storeId },
    })
    if (isExisting) {
      return {
        errors: {
          _form: ['بیلبورد با این نام موجود است!'],
        },
      }
    }
    // console.log(isExisting)
    // console.log(billboard)

    let imageIds: string[] = []
    for (let img of result.data?.images || []) {
      const buffer = Buffer.from(await img.arrayBuffer())
      const res = await uploadFileToS3(buffer, img.name)

      if (res?.imageId && typeof res.imageId === 'string') {
        imageIds.push(res.imageId)
      }
    }
    billboard = await prisma.billboard.create({
      data: {
        label: result.data.label,
        storeId,
        images: {
          connect: imageIds.map((id) => ({
            id: id,
          })),
        },
      },
    })
    // console.log(res?.url)
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

  revalidatePath(path)
  redirect(`/dashboard/${storeId}/billboards`)
}
interface EditBillboardFormState {
  errors: {
    label?: string[]
    images?: string[]
    _form?: string[]
  }
}
export async function editBillboard(
  formData: FormData,
  storeId: string,
  billboardId: string,
  path: string
): Promise<EditBillboardFormState> {
  const result = createBillboardSchema.safeParse({
    label: formData.get('label'),
    images: formData.getAll('images'),
  })

  // console.log(result)
  // console.log(formData.get('image'))

  if (!result.success) {
    // console.log(result.error.flatten().fieldErrors)
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }
  const session = await auth()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  if (!storeId || !billboardId) {
    return {
      errors: {
        _form: ['فروشگاه در دسترس نیست!'],
      },
    }
  }
  // console.log(result)

  try {
    let billboard: Billboard
    const isExisting:
      | (Billboard & { images: { id: string; key: string }[] | null })
      | null = await prisma.billboard.findFirst({
      where: { id: billboardId, storeId },
      include: {
        images: { select: { id: true, key: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['بیلبورد حذف شده است!'],
        },
      }
    }
    const isNameExisting = await prisma.billboard.findFirst({
      where: { label: result.data.label, storeId, NOT: { id: isExisting.id } },
    })

    if (isNameExisting) {
      return {
        errors: {
          _form: ['بیلبورد با این نام موجود است!'],
        },
      }
    }

    // console.log(isExisting)
    // console.log(billboard)

    if (
      typeof result.data.images[0] === 'object' &&
      result.data.images[0] instanceof File
    ) {
      let imageIds: string[] = []
      for (let img of result.data.images) {
        const buffer = Buffer.from(await img.arrayBuffer())
        const res = await uploadFileToS3(buffer, img.name)

        if (res?.imageId && typeof res.imageId === 'string') {
          imageIds.push(res.imageId)
        }
      }

      await prisma.billboard.update({
        where: {
          id: billboardId,
          storeId,
        },
        data: {
          images: {
            //  connect: result.data.writerId?.map((id) => ({ id: id })),
            disconnect: isExisting.images?.map((image: { id: string }) => ({
              id: image.id,
            })),
          },
        },
      })
      billboard = await prisma.billboard.update({
        where: {
          id: billboardId,
          storeId,
        },
        data: {
          label: result.data.label,
          images: {
            // connect: { id: res?.imageId },
            connect: imageIds.map((id) => ({
              id: id,
            })),
          },
        },
      })
    } else {
      await prisma.billboard.update({
        where: {
          id: billboardId,
          storeId,
        },
        data: {
          label: result.data.label,
        },
      })
    }
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

  revalidatePath(path)
  redirect(`/dashboard/${storeId}/billboards`)
}

//////////////////////

interface DeleteBillboardFormState {
  errors: {
    label?: string[]
    image?: string[]
    _form?: string[]
  }
}

export async function deleteBillboard(
  path: string,
  storeId: string,
  billboardId: string,
  formState: DeleteBillboardFormState,
  formData: FormData
): Promise<DeleteBillboardFormState> {
  const session = await auth()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  // console.log(result)
  if (!storeId || !billboardId) {
    return {
      errors: {
        _form: ['فروشگاه در دسترس نیست!'],
      },
    }
  }

  let billboard: Billboard
  try {
    const isExisting:
      | (Billboard & { images: { id: string; key: string }[] | null })
      | null = await prisma.billboard.findFirst({
      where: { id: billboardId, storeId },
      include: {
        images: { select: { id: true, key: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['بیلبورد حذف شده است!'],
        },
      }
    }

    // console.log(isExisting)
    // console.log(billboard)

    if (isExisting.images) {
      for (let image of isExisting.images) {
        if (image.key) {
          await deleteFileFromS3(image.key)
        }
      }
    }
    const deleteBillboard = await prisma.billboard.delete({
      where: {
        id: billboardId,
        storeId,
      },
    })

    // imageId: res?.imageId,
    // console.log(deleteBillboard)
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

  revalidatePath(path)
  redirect(`/dashboard/${storeId}/billboards`)
}
