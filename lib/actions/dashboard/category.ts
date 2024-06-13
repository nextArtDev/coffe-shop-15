'use server'

import { auth } from '@/auth'
import { Category } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../../prisma'

import { deleteFileFromS3, uploadFileToS3 } from './s3Upload'

import { createCategorySchema } from '@/lib/schemas/dashboard/category'

interface CreateCategoryFormState {
  // success?: string
  errors: {
    name?: string[]
    description?: string[]
    billboardId?: string[]
    images?: string[]
    _form?: string[]
  }
}

export async function createCategory(
  formData: FormData,
  storeId: string,
  path: string
): Promise<CreateCategoryFormState> {
  const result = createCategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    images: formData.getAll('images'),
    billboardId: formData.get('billboardId'),
  })
  if (!result.success) {
    console.log(result.error.flatten().fieldErrors)
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }
  // console.log(result?.data.images.length)

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

  const categoryByBillboardId = await prisma.billboard.findFirst({
    where: {
      id: result.data.billboardId,
    },
  })
  if (!categoryByBillboardId) {
    return {
      errors: {
        _form: ['بیلبورد حذف شده است!'],
      },
    }
  }

  // console.log(result)

  let category: Category
  try {
    const isExisting = await prisma.category.findFirst({
      where: {
        name: result.data.name,
        storeId,
        billboardId: result.data.billboardId,
      },
    })
    if (isExisting) {
      return {
        errors: {
          _form: ['دسته‌بندی با این نام موجود است!'],
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
    category = await prisma.category.create({
      data: {
        name: result.data.name,
        images: {
          connect: imageIds.map((id) => ({
            id: id,
          })),
        },
        billboardId: result.data.billboardId,
        storeId,
      },
    })
    // console.log(res?.imageUrl)
    // console.log(category)
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
  redirect(`/dashboard/${storeId}/categories`)
}
interface EditCategoryFormState {
  errors: {
    name?: string[]
    description?: string[]
    billboardId?: string[]
    images?: string[]
    _form?: string[]
  }
}
export async function editCategory(
  formData: FormData,
  storeId: string,
  categoryId: string,
  path: string
): Promise<EditCategoryFormState> {
  const result = createCategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    images: formData.getAll('images'),
    billboardId: formData.get('billboardId'),
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
  if (!storeId || !categoryId) {
    return {
      errors: {
        _form: ['دسته‌بندی در دسترس نیست!'],
      },
    }
  }
  // console.log(result)

  try {
    let category: Category
    const isExisting:
      | (Category & { billboard: { id: string } } & {
          images: { id: string; key: string }[] | null
        })
      | null = await prisma.category.findFirst({
      where: { id: categoryId, storeId },
      include: {
        images: { select: { id: true, key: true } },
        billboard: { select: { id: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['دسته‌بندی حذف شده است!'],
        },
      }
    }
    const isNameExisting = await prisma.category.findFirst({
      where: {
        name: result.data.name,
        billboardId: result.data.billboardId,
        storeId,
        NOT: { id: categoryId },
      },
    })

    if (isNameExisting) {
      return {
        errors: {
          _form: ['دسته‌بندی با این نام موجود است!'],
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
      // console.log(res)
      await prisma.category.update({
        where: {
          id: categoryId,

          storeId,
        },
        data: {
          images: {
            disconnect: isExisting.images?.map((image: { id: string }) => ({
              id: image.id,
            })),
          },
          // billboard: {
          //   disconnect: { id: isExisting.billboard.id },
          // },
        },
      })
      category = await prisma.category.update({
        where: {
          id: categoryId,
          storeId,
        },
        data: {
          name: result.data.name,
          description: result.data.description,
          //   billboardId: result.data.billboardId,
          images: {
            // connect: { id: res?.imageId },
            connect: imageIds.map((id) => ({
              id: id,
            })),
          },
          billboard: {
            connect: { id: result.data.billboardId },
          },
        },
      })
    } else {
      await prisma.category.update({
        where: {
          id: categoryId,
          storeId,
        },
        data: {
          name: result.data.name,
          description: result.data.description,
          billboard: {
            connect: { id: result.data.billboardId },
          },
        },
      })
    }
    // imageId: res?.imageId,
    // console.log(billboard)
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
  redirect(`/dashboard/${storeId}/categories`)
}

//////////////////////

interface DeleteBillboardFormState {
  errors: {
    name?: string[]
    description?: string[]
    billboardId?: string[]
    images?: string[]
    _form?: string[]
  }
}

export async function deleteCategory(
  path: string,
  storeId: string,
  categoryId: string,
  formState: DeleteBillboardFormState,
  formData: FormData
): Promise<DeleteBillboardFormState> {
  // console.log({ path, storeId, categoryId })
  const session = await auth()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  // console.log(result)
  if (!storeId || !categoryId) {
    return {
      errors: {
        _form: ['فروشگاه در دسترس نیست!'],
      },
    }
  }

  try {
    const isExisting:
      | (Category & { images: { id: string; key: string }[] | null })
      | null = await prisma.category.findFirst({
      where: { id: categoryId, storeId },
      include: {
        images: { select: { id: true, key: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['دسته‌بندی حذف شده است!'],
        },
      }
    }

    if (isExisting.images) {
      for (let image of isExisting.images) {
        if (image.key) {
          await deleteFileFromS3(image.key)
        }
      }
    }
    await prisma.category.delete({
      where: {
        id: categoryId,
        storeId,
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

  revalidatePath(path)
  redirect(`/dashboard/${storeId}/categories`)
}
