import { prisma } from '@/lib/prisma'
import { IngredientForm } from './components/category-form'

const IngredientPage = async ({
  params,
}: {
  params: { ingredientId: string; storeId: string }
}) => {
  const ingredient = await prisma.ingredients.findUnique({
    where: {
      id: params.ingredientId,
    },
    include: {
      images: { select: { url: true } },
    },
  })
  //if any 'billboardId' we'll gonna use that as initial data, if not just we route here to create a new billboard
  const billboards = await prisma.billboard.findMany({
    where: {
      storeId: params.storeId,
    },
  })

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <IngredientForm initialData={ingredient} />
      </div>
    </div>
  )
}

export default IngredientPage
