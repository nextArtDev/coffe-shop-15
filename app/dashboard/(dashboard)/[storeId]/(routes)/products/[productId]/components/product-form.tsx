'use client'

import * as z from 'zod'
// import axios from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { Category, Ingredients, Product } from '@prisma/client'
import { Loader, Trash } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Separator } from '@/components/ui/separator'

// import ImageUpload from "@/components/ui/image-upload"
// import { toast } from '@/components/ui/use-toast'

// import ImageUpload from '@/components/ImageUpload'
import { Heading } from '@/components/dashboard/Heading'
import { AlertModal } from '@/components/dashboard/modals/alert-modal'
import { cn } from '@/lib/utils'

import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import ImageSlider from '@/components/dashboard/ImageSlider'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

import {
  createProduct,
  deleteProduct,
  editProduct,
} from '@/lib/actions/dashboard/products'
import { createProductSchema } from '@/lib/schemas/dashboard/product'
// import MultipleSelector from './MultiSelector'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '@/components/ui/multi-select'
import Image from 'next/image'
import { MultiSelect } from './MultiSelect'
import MultipleSelector, { Option } from './MultiSelector'
// import { MultiSelect } from './MultiSelect'

type ProductFormValues = z.infer<typeof createProductSchema>

//if there is any billboard its Billboard, else its null
interface ProductFormProps {
  //there is a chance to have no initial data and in fact we're creating one.
  initialData:
    | (Product & { images: { url: string }[] } & {
        ingredients: { name: string; id: string }[] | null
      })
    | null
  categories: Category[]
  ingredients: Ingredients[]
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  ingredients,
}) => {
  const params = useParams()
  const storeId = params.soreId
  const categoryId = initialData?.id
  const router = useRouter()
  const path = usePathname()

  const [open, setOpen] = useState(false)
  // const [files, setFiles] = useState(
  //   initialData?.images?.[0].url ? initialData.images?.[0].url : ''
  // )
  const [files, setFiles] = useState<File[]>([])
  const [isPending, startTransition] = useTransition()

  const title = initialData ? 'ویرایش محصول' : 'ایجاد محصول'
  const description = initialData ? 'ویرایش محصول.' : 'اضافه کردن محصول جدید'
  const toastMessage = initialData ? 'محصول آپدیت شد.' : 'محصول ایجاد شد.'
  const action = initialData ? 'ذخیره تغییرات' : 'ایجاد'

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          price: parseFloat(String(initialData?.price)),
          caffeine: parseFloat(String(initialData?.caffeine)),
          // initialData.caffeine !== null
          //   ? Number(initialData.caffeine)
          //   : undefined,
          sugarContent: parseFloat(String(initialData?.sugarContent)),

          categoryId: initialData.categoryId,
          // price:+ initialData.price || 0 ,

          // images:initialData.images.map(image=>image.url)|| [],
          ingredientIds: initialData?.ingredients?.map((t) => t.id),

          isHot: initialData.isHot || true,
          isDairy: initialData.isDairy || false,
          isArchived: initialData.isArchived,
          isFeatured: initialData.isFeatured,

          // description: initialData?.description || '',
          // image: initialData?.image?.url || '',
          // ingredients: initialData?.ingredients.name,
        }
      : {
          name: '',
          description: '',
          // images: [],
          price: 0,
          categoryId: '',
          caffeine: 0,
          sugarContent: 0,
          ingredientIds: [],
          isFeatured: false,
          isArchived: false,
          isHot: true,
          isDairy: false,
        },
  })
  // const [formState, createAction] = useFormState(
  //   createCategory.bind(null, path, storeId as string),
  //   {
  //     errors: {},
  //   }
  // )
  // const [imageFormState, uploadAction] = useFormState(upImage, {
  //   errors: {},
  //   success: '',
  // })

  // const [editFormState, editAction] = useFormState(
  //   editCategory.bind(null, path, storeId as string, categoryId as string),
  //   {
  //     errors: {},
  //   }
  // )
  const [deleteState, deleteAction] = useFormState(
    deleteProduct.bind(
      null,
      path,
      params.storeId as string,
      params.productId as string
    ),
    {
      errors: {},
    }
  )

  const onSubmit = async (data: ProductFormValues) => {
    // console.log(data)
    const formData = new FormData()
    // const caffeine = + data?.caffeine
    // const sugarContent =  + data?.sugarContent
    // formData.append('image', data.image)
    // formData.append('name', data.name)
    // formData.append('billboardId', data.billboardId)
    // formData.append('description', data.description || '')
    formData.append('name', data.name)
    formData.append('description', data.description || '')
    formData.append('price', String(data.price))
    formData.append('caffeine', String(data.caffeine))
    formData.append('sugarContent', String(data.sugarContent))

    if (data.ingredientIds && data.ingredientIds.length > 0) {
      for (let ingredientsIds of data.ingredientIds) {
        formData.append('ingredientIds', ingredientsIds)
      }
    }
    formData.append('categoryId', data.categoryId)
    // console.log(formData.get('categoryId'))

    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        formData.append('images', data.images[i])
      }
    }
    console.log(formData.getAll('images'))
    // formData.append('image', data.image)
    // if (data.isFeatured) {
    //   formData.append('isFeatured', data.isFeatured)
    // }
    if (data.isArchived) {
      formData.append('isArchived', 'true')
    } else {
      formData.append('isArchived', 'false')
    }
    if (data.isFeatured) {
      formData.append('isFeatured', 'true')
    } else {
      formData.append('isFeatured', 'false')
    }
    if (data.isHot) {
      formData.append('isHot', 'true')
    } else {
      formData.append('isHot', 'false')
    }
    if (data.isDairy) {
      formData.append('isDairy', 'true')
    } else {
      formData.append('isDairy', 'false')
    }

    try {
      if (initialData) {
        console.log({ data, initialData })
        startTransition(() => {
          editProduct(
            formData,
            params.storeId as string,
            initialData.id as string,
            path
          )
            .then((res) => {
              // if (res?.errors?._form) {
              //   toast.error(res?.errors._form?.join(' و '))
              //   form.setError('root', {
              //     type: 'custom',
              //     message: res?.errors?._form?.join(' و '),
              //   })
              // }
              if (res?.errors?.name) {
                form.setError('name', {
                  type: 'custom',
                  message: res?.errors.name?.join(' و '),
                })
              } else if (res?.errors?.description) {
                form.setError('description', {
                  type: 'custom',
                  message: res?.errors.description?.join(' و '),
                })
              } else if (res?.errors?.caffeine) {
                form.setError('caffeine', {
                  type: 'custom',
                  message: res?.errors?.caffeine?.join(' و '),
                })
              } else if (res?.errors?.sugarContent) {
                form.setError('sugarContent', {
                  type: 'custom',
                  message: res?.errors.sugarContent?.join(' و '),
                })
              } else if (res?.errors?.price) {
                form.setError('price', {
                  type: 'custom',
                  message: res?.errors.price?.join(' و '),
                })
              } else if (res?.errors?.isHot) {
                form.setError('isHot', {
                  type: 'custom',
                  message: res?.errors?.isHot?.join(' و '),
                })
              }
              if (res?.errors?.isDairy) {
                form.setError('isDairy', {
                  type: 'custom',
                  message: res?.errors.isDairy?.join(' و '),
                })
              } else if (res?.errors?.categoryId) {
                form.setError('categoryId', {
                  type: 'custom',
                  message: res?.errors.categoryId?.join(' و '),
                })
              } else if (res?.errors?.images) {
                form.setError('images', {
                  type: 'custom',
                  message: res?.errors?.images?.join(' و '),
                })
              }
              if (res?.errors?.isFeatured) {
                form.setError('isFeatured', {
                  type: 'custom',
                  message: res?.errors.isFeatured?.join(' و '),
                })
              } else if (res?.errors?.isArchived) {
                form.setError('isArchived', {
                  type: 'custom',
                  message: res?.errors.isArchived?.join(' و '),
                })
              } else if (res?.errors?.ingredientIds) {
                form.setError('ingredientIds', {
                  type: 'custom',
                  message: res?.errors?.ingredientIds?.join(' و '),
                })
              } else if (res?.errors?._form) {
                // form.setError('root', {
                //   type: 'custom',
                //   message: res?.errors?._form?.join(' و '),
                // })
                toast.error(res?.errors?._form?.join(' و '))
              }
              // if (res?.success) {
              //    toast.success(toastMessage)
              // }
            })
            .catch(() => toast.error('مشکلی پیش آمده.'))
        })
      } else {
        startTransition(() => {
          createProduct(formData, params.storeId as string, path)
            .then((res) => {
              // if (res?.errors?._form) {
              //   toast.error(res?.errors._form?.join(' و '))
              //   form.setError('root', {
              //     type: 'custom',
              //     message: res?.errors?._form?.join(' و '),
              //   })
              // }
              if (res?.errors?.name) {
                form.setError('name', {
                  type: 'custom',
                  message: res?.errors.name?.join(' و '),
                })
              } else if (res?.errors?.description) {
                form.setError('description', {
                  type: 'custom',
                  message: res?.errors.description?.join(' و '),
                })
              } else if (res?.errors?.caffeine) {
                form.setError('caffeine', {
                  type: 'custom',
                  message: res?.errors?.caffeine?.join(' و '),
                })
              }
              if (res?.errors?.sugarContent) {
                form.setError('sugarContent', {
                  type: 'custom',
                  message: res?.errors.sugarContent?.join(' و '),
                })
              } else if (res?.errors?.price) {
                form.setError('price', {
                  type: 'custom',
                  message: res?.errors.price?.join(' و '),
                })
              } else if (res?.errors?.isHot) {
                form.setError('isHot', {
                  type: 'custom',
                  message: res?.errors?.isHot?.join(' و '),
                })
              }
              if (res?.errors?.isDairy) {
                form.setError('isDairy', {
                  type: 'custom',
                  message: res?.errors.isDairy?.join(' و '),
                })
              } else if (res?.errors?.categoryId) {
                form.setError('categoryId', {
                  type: 'custom',
                  message: res?.errors.categoryId?.join(' و '),
                })
              } else if (res?.errors?.images) {
                form.setError('images', {
                  type: 'custom',
                  message: res?.errors?.images?.join(' و '),
                })
              }
              if (res?.errors?.isFeatured) {
                form.setError('isFeatured', {
                  type: 'custom',
                  message: res?.errors.isFeatured?.join(' و '),
                })
              } else if (res?.errors?.isArchived) {
                form.setError('isArchived', {
                  type: 'custom',
                  message: res?.errors.isArchived?.join(' و '),
                })
              } else if (res?.errors?.ingredientIds) {
                form.setError('ingredientIds', {
                  type: 'custom',
                  message: res?.errors?.ingredientIds?.join(' و '),
                })
              } else if (res?.errors?._form) {
                // form.setError('root', {
                //   type: 'custom',
                //   message: res?.errors?._form?.join(' و '),
                // })
                toast.error(res?.errors?._form?.join(' و '))
              }
              // if (res?.success) {
              //    toast.success(toastMessage)
              // }
            })
            .catch(() => toast.error('مشکلی پیش آمده.'))
        })
      }
    } catch {
      toast.error('مشکلی پیش آمده، لطفا دوباره امتحان کنید!')
    }
  }

  const validUrls = initialData
    ? (initialData.images
        .map((img: { url: string }) => img.url)
        .filter(Boolean) as string[])
    : (files
        .map((file) => URL.createObjectURL(file))
        .filter(Boolean) as string[])
  // console.log(form.formState.errors)
  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={deleteAction}
        isPending={isPending}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {/* in case there is initial data it means we want to edit it */}
        {initialData && (
          <Button
            disabled={isPending}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />

      <Form {...form}>
        <form
          // action={initialData ? editAction : createAction}
          // action={(data) => console.log(data.get('billboardId'))}
          onSubmit={form.handleSubmit(onSubmit)}
          // action={async (formData: FormData) => {
          //   console.log(formData.get('billboardId'))
          // }}
          className="grid grid-cols-2 lg:grid-cols-4 space-y-8 gap-x-4 w-full"
        >
          <div className="col-span-2 lg:col-span-4 max-w-md ">
            {files.length > 0 ? (
              <div className="h-96 md:h-[450px] overflow-hidden rounded-md">
                <AspectRatio ratio={1 / 1} className="relative h-full">
                  <ImageSlider urls={validUrls} />
                </AspectRatio>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="images"
                render={({ field: { onChange }, ...field }) => (
                  <FormItem>
                    <FormLabel className="mx-auto cursor-pointer bg-transparent rounded-xl flex flex-col justify-center gap-4 items-center border-2 border-black/20 dark:border-white/20 border-dashed w-full h-24 shadow  ">
                      {/* <FileUp size={42} className=" " /> */}
                      <span
                        className={cn(buttonVariants({ variant: 'ghost' }))}
                      >
                        انتخاب عکس
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple={true}
                        disabled={form.formState.isSubmitting}
                        {...field}
                        onChange={async (event) => {
                          // Triggered when user uploaded a new file
                          // FileList is immutable, so we need to create a new one
                          const dataTransfer = new DataTransfer()

                          // Add old images
                          if (files) {
                            Array.from(files).forEach((image) =>
                              dataTransfer.items.add(image)
                            )
                          }

                          // Add newly uploaded images
                          Array.from(event.target.files!).forEach((image) =>
                            dataTransfer.items.add(image)
                          )

                          // Validate and update uploaded file
                          const newFiles = dataTransfer.files

                          setFiles(Array.from(newFiles))

                          onChange(newFiles)
                        }}
                      />
                    </FormControl>
                    <FormDescription className="flex justify-center items-center"></FormDescription>
                    {/* <FormMessage className="dark:text-rose-400" /> */}
                    <FormMessage>
                      {/* @ts-ignore */}
                      {form.getFieldState('images')?.error?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            )}
          </div>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>عنوان</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="عنوان محصول"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.getFieldState('name')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>دسته‌بندی</FormLabel>
                <Select
                  dir="rtl"
                  // disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        defaultValue={field.value}
                        placeholder="یک دسته را انتخاب کنید"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>
                  {form.getFieldState('categoryId')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>درباره محصول</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isPending}
                    placeholder="درباره محصول"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.getFieldState('description')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>قیمت</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="قیمت محصول "
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.getFieldState('price')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="caffeine"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>کافئین</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="میزان کافئین"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.getFieldState('caffeine')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sugarContent"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>میزان شکر</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="میزان شکر"
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.getFieldState('sugarContent')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          {ingredients.length > 0 && (
            <FormField
              control={form.control}
              name="ingredientIds"
              render={({ field }) => (
                <FormItem className="max-w-md">
                  <FormLabel>مخلفات</FormLabel>
                  {/* <MultipleSelector
                    {...field}
                    onChange={field.onChange}
                    defaultOptions={
                      ingredients.map((ingredient) => ({
                        value: ingredient.id,
                        label: ingredient.name,
                      })) as Option[]
                    }
                    placeholder="مخلفات را اتخاب کنید..."
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        بدون نتیجه
                      </p>
                    }
                  /> */}

                  {/* <MultiSelect
                    selected={field.value!}
                    options={ingredients.map((ingredient) => {
                      return { value: ingredient.id, label: ingredient.name }
                    })}
                    // onChange={console.log(form.getValues('ingredientIds'))}
                    {...field}
                    // className="sm:w-[510px]"
                  /> */}
                  <MultiSelector
                    onValuesChange={field.onChange}
                    values={field.value!}
                  >
                    <MultiSelectorTrigger>
                      <MultiSelectorInput placeholder="انتخاب مخلفات..." />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {ingredients.map((ingredient) => (
                          <MultiSelectorItem
                            key={ingredient.id}
                            value={ingredient.id}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{ingredient.name}</span>
                            </div>
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>

                  <FormMessage>
                    {form.getFieldState('ingredientIds')?.error?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="isHot"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    // @ts-ignore
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1  leading-none">
                  <FormLabel className="pr-2">گرم</FormLabel>
                  <FormDescription className="text-xs">
                    آیا محصول جزو منوی گرم شماست؟
                  </FormDescription>
                </div>
                <FormMessage>
                  {form.getFieldState('isFeatured')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isDairy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    // @ts-ignore
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="pr-2"> لبنی</FormLabel>
                  <FormDescription className="text-xs">
                    آیا این محصول دارای فرآورده‌های لبنی است؟
                  </FormDescription>
                </div>
                <FormMessage>
                  {form.getFieldState('isArchived')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    // @ts-ignore
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1  leading-none">
                  <FormLabel className="pr-2">ویژه</FormLabel>
                  <FormDescription className="text-xs">
                    این محصول در صفحه اول نمایش داده شود.
                  </FormDescription>
                </div>
                <FormMessage>
                  {form.getFieldState('isFeatured')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isArchived"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    // @ts-ignore
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="pr-2">آرشیو شده</FormLabel>
                  <FormDescription className="text-xs">
                    این محصول از فروشگاه پنهان شود
                  </FormDescription>
                </div>
                <FormMessage>
                  {form.getFieldState('isArchived')?.error?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          <Button disabled={isPending} className="w-full ml-auto">
            {isPending ? (
              <Loader className="animate-spin w-full h-full " />
            ) : (
              action
            )}
          </Button>
        </form>
      </Form>
    </>
  )
}
