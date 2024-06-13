import { prisma } from '@/lib/prisma'
import { Billboard, Category } from '@prisma/client'
import { cache } from 'react'

export const getAllBillboardsForBillboards = cache(
  ({ storeId }: { storeId: string }): Promise<Billboard[] | null> => {
    const billboards = prisma.billboard.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return billboards
  }
)
export const getAllBillboards = cache((): Promise<Billboard[] | null> => {
  const billboards = prisma.billboard.findMany({
    where: {
      storeId: process.env.STORE_ID,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return billboards
})
export const getAllBillboardsWithCategories = cache(
  (): Promise<(Billboard & { categories: Category[] })[] | null> => {
    const billboards = prisma.billboard.findMany({
      where: {
        storeId: process.env.STORE_ID,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        categories: true,
      },
    })
    return billboards
  }
)
