'use server'

import { auth } from '@/auth'

import { prisma } from '../../prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Billboard, Category, Image, Product, Store } from '@prisma/client'

import { deleteFileFromS3, uploadFileToS3 } from './s3Upload'
import {
  createProductSchema,
  createServerProductSchema,
} from '@/lib/schemas/dashboard/product'

interface CreateProductFormState {
  success?: string
  errors: {
    name?: string[]
    description?: string[]
    caffeine?: string[]
    sugarContent?: string[]
    price?: string[]
    isHot?: string[]
    isDairy?: string[]
    categoryId?: string[]
    images?: string[]
    isFeatured?: string[]
    isArchived?: string[]
    ingredientIds?: string[]
    _form?: string[]
  }
}

export async function createProduct(
  formData: FormData,
  storeId: string,
  path: string
): Promise<CreateProductFormState> {
  const result = createServerProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    caffeine: formData.get('caffeine'),
    sugarContent: formData.get('sugarContent'),
    categoryId: formData.get('categoryId'),
    image: formData.getAll('images'),
    price: formData.get('price'),
    isFeatured: formData.get('isFeatured'),
    isArchived: formData.get('isArchived'),
    isHot: formData.get('isHot'),
    isDairy: formData.get('isDairy'),
  })
  // console.log(result)

  //   console.log(formData.getAll('writerId'))
  //   console.log(formData.get('categoryId'))
  //   console.log(formData.get('price'))
  //   console.log(formData.getAll('image'))
  if (!result.success) {
    console.log(result.error.flatten().fieldErrors)
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

  const category = await prisma.category.findFirst({
    where: {
      id: result.data.categoryId,
    },
  })
  if (!category) {
    return {
      errors: {
        _form: ['دسته‌بندی حذف شده است!'],
      },
    }
  }

  //   // console.log(result)

  let product: Product
  try {
    const isExisting = await prisma.product.findFirst({
      where: {
        name: result.data.name,
        storeId,
        categoryId: result.data.categoryId,
      },
    })
    if (isExisting) {
      return {
        errors: {
          _form: ['کتاب با این نام و شابک موجود است!'],
        },
      }
    }

    const isFeaturedBoolean = result.data.isFeatured == 'true'
    const isDairyBoolean = result.data.isDairy == 'true'
    const isHotBoolean = result.data.isHot == 'true'
    const isArchivedBoolean = result.data.isArchived == 'true'

    let imageIds: string[] = []
    for (let img of result.data?.images || []) {
      const buffer = Buffer.from(await img.arrayBuffer())
      const res = await uploadFileToS3(buffer, img.name)

      if (res?.imageId && typeof res.imageId === 'string') {
        imageIds.push(res.imageId)
      }
    }
    // console.log(imageIds)
    // console.log('data', result.data)
    product = await prisma.product.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        caffeine: result.data.caffeine,
        sugarContent: result.data.sugarContent,
        price: +result.data.price,
        categoryId: result.data.categoryId,
        isHot: isHotBoolean,
        isDairy: isDairyBoolean,
        isFeatured: isFeaturedBoolean,
        isArchived: isArchivedBoolean,

        // summary: result.data.summary,
        // categoryId: result.data.categoryId,
        // isArchived: isArchivedBoolean,
        // isFeatured: isFeaturedBoolean,
        // price: +result.data.price,
        // caffeine: +result.data.caffeine,
        // sugarContent: +result.data.sugarContent,
        images: {
          connect: imageIds.map((id) => ({
            id: id,
          })),
        },
        storeId,
      },
    })
    // console.log({ product })
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
  redirect(`/dashboard/${storeId}/products`)
}

export async function editProduct(
  formData: FormData,
  storeId: string,
  productId: string,
  path: string
): Promise<CreateProductFormState> {
  const result = createServerProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    caffeine: formData.get('caffeine'),
    sugarContent: formData.get('sugarContent'),
    categoryId: formData.get('categoryId'),
    images: formData.getAll('images'),
    price: formData.get('price'),
    isFeatured: formData.get('isFeatured'),
    isArchived: formData.get('isArchived'),
    isHot: formData.get('isHot'),
    isDairy: formData.get('isDairy'),
  })
  // console.log(result)
  // console.log(formData.get('image'))

  if (!result.success) {
    // console.log(result.error.flatten().fieldErrors)
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }
  // console.log(result.data.isArchived)
  // console.log(result.data.isFeatured)
  const session = await auth()
  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      errors: {
        _form: ['شما اجازه دسترسی ندارید!'],
      },
    }
  }
  if (!storeId || !productId) {
    return {
      errors: {
        _form: ['دسته‌بندی در دسترس نیست!'],
      },
    }
  }
  // console.log(result)

  let product: Product
  try {
    const isExisting = await prisma.product.findFirst({
      where: {
        id: productId,
        // isbn: result.data.isbn,
        // title: result.data.title,
        storeId,
      },
      include: {
        images: true,
        ingredients: true,
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['محصول حذف شده است!!'],
        },
      }
    }

    const isFeaturedBoolean = result.data.isFeatured == 'true'
    const isDairyBoolean = result.data.isDairy == 'true'
    const isHotBoolean = result.data.isHot == 'true'
    const isArchivedBoolean = result.data.isArchived == 'true'

    const isNameExisting = await prisma.product.findFirst({
      where: {
        name: result.data.name,

        categoryId: result.data.categoryId,
        storeId,
        NOT: { id: productId },
      },
    })

    if (isNameExisting) {
      return {
        errors: {
          _form: ['این کتاب موجود است!'],
        },
      }
    }
    // await prisma.product.update({
    //   where: {
    //     id: productId,
    //     storeId,
    //   },
    //   data: {
    //     // ingredients:
    //   },
    // })

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
      // const buffer = Buffer.from(await result.data.image.arrayBuffer())
      // const res = await uploadFileToS3(buffer, result.data.image.name)

      // if (isExisting.image?.key) {
      //   await deleteFileFromS3(isExisting.image.key)
      //   // console.log(isDeletedFromS3)
      // }
      // console.log(res)
      await prisma.product.update({
        where: {
          id: productId,

          storeId,
        },
        data: {
          images: {
            //  connect: result.data.writerId?.map((id) => ({ id: id })),
            disconnect: isExisting.images.map((image: { id: string }) => ({
              id: image.id,
            })),
          },
        },
      })
      await prisma.product.update({
        where: {
          id: productId,
          storeId,
        },
        data: {
          name: result.data.name,
          description: result.data.description,
          caffeine: Number(result.data.caffeine),
          sugarContent: Number(result.data.sugarContent),
          price: +result.data.price,
          isHot: isHotBoolean,
          isDairy: isDairyBoolean,
          categoryId: result.data.categoryId,
          isFeatured: isFeaturedBoolean,
          isArchived: isArchivedBoolean,
          images: {
            connect: imageIds.map((id) => ({
              id: id,
            })),
          },
          storeId,
        },
      })
    } else {
      await prisma.product.update({
        where: {
          id: productId,
          storeId,
        },
        data: {
          name: result.data.name,
          description: result.data.description,
          caffeine: Number(result.data.caffeine),
          sugarContent: Number(result.data.sugarContent),
          price: result.data.price,
          categoryId: result.data.categoryId,
          isHot: isHotBoolean,
          isDairy: isDairyBoolean,
          isFeatured: isFeaturedBoolean,
          isArchived: isArchivedBoolean,
          // images: result.data.images,
          storeId,
        },
      })
    }

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
  redirect(`/dashboard/${storeId}/products`)
}

//////////////////////

interface DeleteProductFormState {
  errors: {
    name?: string[]
    description?: string[]
    billboardId?: string[]
    image?: string[]
    _form?: string[]
  }
}

export async function deleteProduct(
  path: string,
  storeId: string,
  productId: string,
  formState: DeleteProductFormState,
  formData: FormData
): Promise<DeleteProductFormState> {
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
  if (!storeId || !productId) {
    return {
      errors: {
        _form: ['کتاب در دسترس نیست!'],
      },
    }
  }

  try {
    const isExisting:
      | (Product & { images: { id: string; key: string }[] | null })
      | null = await prisma.product.findFirst({
      where: { id: productId, storeId },
      include: {
        images: { select: { id: true, key: true } },
      },
    })
    if (!isExisting) {
      return {
        errors: {
          _form: ['کتاب حذف شده است!'],
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
    await prisma.product.delete({
      where: {
        id: productId,
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
  redirect(`/dashboard/${storeId}/products`)
}
