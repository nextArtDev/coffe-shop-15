// import { format } from 'date-fns'
import { format } from 'date-fns-jalali'
import { IngredientColumn } from './components/columns'

import { getAllCategories } from '@/lib/queries/dashboard/categories'
import { notFound } from 'next/navigation'

import { getAllIngredients } from '@/lib/queries/dashboard/ingredienets'
import { IngredientsClient } from './components/IngredientsClient'

const IngredientsPage = async ({ params }: { params: { storeId: string } }) => {
  const ingredients = await getAllIngredients(params.storeId)

  if (!ingredients) {
    return notFound()
  }
  const formattedIngredients: IngredientColumn[] = ingredients.map((item) => ({
    id: item.id,
    name: item.name,

    createdAt: format(item.createdAt, 'dd MMMM yyyy'),
  }))

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <IngredientsClient data={formattedIngredients} />
      </div>
    </div>
  )
}

export default IngredientsPage
