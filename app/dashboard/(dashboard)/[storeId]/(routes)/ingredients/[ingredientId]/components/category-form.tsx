'use client'

import * as z from 'zod'
// import axios from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'

import { Ingredients } from '@prisma/client'
import { Loader, Trash } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

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
import { createCategory } from '@/lib/actions/dashboard/category'
import {
  createIngredient,
  deleteIngredient,
  editIngredient,
} from '@/lib/actions/dashboard/ingredient'
import { createIngredientSchema } from '@/lib/schemas/dashboard/ingredient'

type IngredientFormValues = z.infer<typeof createIngredientSchema>

//if there is any billboard its Billboard, else its null
interface IngredientFormProps {
  //there is a chance to have no initial data and in fact we're creating one.

  initialData:
    | (Partial<Ingredients> & { images: { url: string }[] | null })
    | null
}

export const IngredientForm: React.FC<IngredientFormProps> = ({
  initialData,
}) => {
  const params = useParams()
  const storeId = params.soreId

  // console.log(params.storeId)
  const router = useRouter()
  const path = usePathname()

  const [open, setOpen] = useState(false)
  // const [files, setFiles] = useState(
  //   initialData?.imageId ? initialData.image?.url : ''
  // )
  const [files, setFiles] = useState<File[]>([])

  const [isPending, startTransition] = useTransition()

  const title = initialData ? 'ویرایش مخلفات' : 'ایجاد مخلفات'
  const description = initialData ? 'ویرایش مخلفات.' : 'اضافه کردن مخلفات جدید'
  const toastMessage = initialData ? 'مخلفات آپدیت شد.' : 'مخلفات ایجاد شد.'
  const action = initialData ? 'ذخیره تغییرات' : 'ایجاد'

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(createIngredientSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          images: initialData?.images?.map((img) => img.url),
        }
      : {
          name: '',

          // image: undefined,
        },
  })

  const [deleteState, deleteAction] = useFormState(
    deleteIngredient.bind(
      null,
      path,
      params.storeId as string,
      params.ingredientId as string
    ),
    {
      errors: {},
    }
  )

  const onSubmit = async (data: IngredientFormValues) => {
    const formData = new FormData()

    formData.append('name', data.name)

    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        formData.append('images', data.images[i])
      }
    }

    try {
      if (initialData) {
        // console.log({ data, initialData })
        startTransition(() => {
          editIngredient(
            formData,
            params.storeId as string,
            initialData.id as string,
            path
          )
            .then((res) => {
              if (res?.errors?.name) {
                form.setError('name', {
                  type: 'custom',
                  message: res?.errors.name?.join(' و '),
                })
              } else if (res?.errors?.images) {
                form.setError('images', {
                  type: 'custom',
                  message: res?.errors.images?.join(' و '),
                })
              } else if (res?.errors?._form) {
                toast.error(res?.errors._form?.join(' و '))
              }
              // if (res?.success) {
              //    toast.success(toastMessage)
              // }
            })
            // TODO: fixing Through Error when its ok
            // .catch(() => toast.error('مشکلی پیش آمده.'))
            .catch(() => console.log('مشکلی پیش آمده.'))
        })
      } else {
        startTransition(() => {
          createIngredient(formData, params.storeId as string, path)
            .then((res) => {
              if (res?.errors?.name) {
                form.setError('name', {
                  type: 'custom',
                  message: res?.errors.name?.join(' و '),
                })
              } else if (res?.errors?.images) {
                form.setError('images', {
                  type: 'custom',
                  message: res?.errors.images?.join(' و '),
                })
              } else if (res?.errors?._form) {
                toast.error(res?.errors._form?.join(' و '))
                form.setError('root', {
                  type: 'custom',
                  message: res?.errors?._form?.join(' و '),
                })
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
  const validUrls =
    initialData && initialData.images
      ? (initialData.images.map((img) => img.url).filter(Boolean) as string[])
      : (files
          .map((file) => URL.createObjectURL(file))
          .filter(Boolean) as string[])

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
          className="space-y-8 w-full"
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
                <FormLabel>نام</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="نام مخلفات"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={isPending} className="ml-auto">
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
