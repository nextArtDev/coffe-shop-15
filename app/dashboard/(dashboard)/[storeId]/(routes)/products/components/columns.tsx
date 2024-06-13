'use client'

import { ColumnDef } from '@tanstack/react-table'

import { CellAction } from './CellAction'

export type ProductColumn = {
  id: string
  name: string
  price: string | null
  category: string
  createdAt: string
  isFeatured: boolean | string
  isArchived: boolean | string
}

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: 'name',
    header: 'نام',
  },
  {
    accessorKey: 'isArchived',
    header: 'آرشیو شده',
  },
  {
    accessorKey: 'isFeatured',
    header: 'ویژه',
  },
  {
    accessorKey: 'price',
    header: 'قیمت',
  },
  {
    accessorKey: 'category',
    header: 'دسته‌بندی',
  },
  {
    accessorKey: 'createdAt',
    header: 'تاریخ',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
