import { prisma } from '@/lib/prisma'
import {
  Billboard,
  Category,
  Image,
  Ingredients,
  Product,
} from '@prisma/client'
import { cache } from 'react'

export const getAllIngredients = cache(
  (
    storeId: string
  ): Promise<
    | (Ingredients & {
        images: { url: string }[]
      })[]
    | null
  > => {
    const ingredients = prisma.ingredients.findMany({
      where: {
        storeId,
      },
      include: {
        images: {
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return ingredients
  }
)
