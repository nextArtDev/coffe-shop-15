'use server'

import { auth } from '@/auth'
import { Category, Ingredients } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../../prisma'

import { deleteFileFromS3, uploadFileToS3 } from './s3Upload'

import { createCategorySchema } from '@/lib/schemas/dashboard/category'
import { createIngredientSchema } from '@/lib/schemas/dashboard/ingredient'

interface CreateIngredientFormState {
  // success?: string
  errors: {
    name?: string[]
    description?: string[]
    billboardId?: string[]
    images?: string[]
    _form?: string[]
  }
}

export async function createIngredient(
  formData: FormData,
  storeId: string,
  path: string
): Promise<CreateIngredientFormState> {
  const result = createIngredientSchema.safeParse({
    name: formData.get('name'),

    images: formData.getAll('images'),
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

  let ingredient: Ingredients
  try {
    const isExisting = await prisma.ingredients.findFirst({
      where: {
        name: result.data.name,
        storeId,
      },
    })
    if (isExisting) {
      return {
        errors: {
          _form: ['مخلفات با این نام موجود است!'],
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
    ingredient = await prisma.ingredients.create({
      data: {
        name: result.data.name,
        images: {
          connect: imageIds.map((id) => ({
            id: id,
          })),
        },

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
  redirect(`/dashboard/${storeId}/ingredients`)
}
interface EditIngredientFormState {
  errors: {
    name?: string[]

    images?: string[]
    _form?: string[]
  }
}
export async function editIngredient(
  formData: FormData,
  storeId: string,
  ingredientId: string,
  path: string
): Promise<EditIngredientFormState> {
  const result = createIngredientSchema.safeParse({
    name: formData.get('name'),

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

  let ingredient: Ingredients
  try {
    const isExisting:
      | (Ingredients & {
          images: { id: string; key: string }[] | null
        })
      | null = await prisma.ingredients.findFirst({
      where: { id: ingredientId, storeId },
      include: {
        images: { select: { id: true, key: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['مخلفات حذف شده است!'],
        },
      }
    }
    const isNameExisting = await prisma.ingredients.findFirst({
      where: {
        name: result.data.name,

        storeId,
        NOT: { id: ingredientId },
      },
    })

    if (isNameExisting) {
      return {
        errors: {
          _form: ['مخلفات با این نام موجود است!'],
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
      await prisma.ingredients.update({
        where: {
          id: ingredientId,

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
      ingredient = await prisma.ingredients.update({
        where: {
          id: ingredientId,
          storeId,
        },
        data: {
          name: result.data.name,

          images: {
            // connect: { id: res?.imageId },
            connect: imageIds.map((id) => ({
              id: id,
            })),
          },
        },
      })
    } else {
      await prisma.ingredients.update({
        where: {
          id: ingredientId,
          storeId,
        },
        data: {
          name: result.data.name,
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
  redirect(`/dashboard/${storeId}/ingredients`)
}

//////////////////////

interface DeleteIngredientFormState {
  errors: {
    name?: string[]

    images?: string[]
    _form?: string[]
  }
}

export async function deleteIngredient(
  path: string,
  storeId: string,
  ingredientId: string,
  formState: DeleteIngredientFormState,
  formData: FormData
): Promise<DeleteIngredientFormState> {
  // console.log({ path, storeId, ingredientId })
  const session = await auth()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  // console.log(result)
  if (!storeId || !ingredientId) {
    return {
      errors: {
        _form: ['فروشگاه در دسترس نیست!'],
      },
    }
  }

  try {
    const isExisting:
      | (Ingredients & { images: { id: string; key: string }[] | null })
      | null = await prisma.ingredients.findFirst({
      where: { id: ingredientId, storeId },
      include: {
        images: { select: { id: true, key: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['مخلفات حذف شده است!'],
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
    await prisma.ingredients.delete({
      where: {
        id: ingredientId,
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
  redirect(`/dashboard/${storeId}/ingredients`)
}
