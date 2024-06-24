import { prisma } from '@/lib/prisma'
import { ProductForm } from './components/product-form'
import { Product } from '@prisma/client'

const ProductPage = async ({
  params,
}: {
  params: { productId: string; storeId: string }
}) => {
  const product:
    | (Product & { images: { url: string }[] } & {
        category: { id: string }
      } & { ingredients: { id: string; name: string }[] })
    | null = await prisma.product.findUnique({
    where: {
      id: params.productId,
    },
    include: {
      images: { select: { url: true } },
      ingredients: { select: { id: true, name: true } },
      category: { select: { id: true } },
    },
  })
  const categories = await prisma.category.findMany({
    where: {
      storeId: params.storeId,
    },
  })
  const ingredients = await prisma.ingredients.findMany({
    where: {
      storeId: params.storeId,
    },
  })

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm
          ingredients={ingredients}
          categories={categories}
          initialData={product}
        />
      </div>
    </div>
  )
}

export default ProductPage
