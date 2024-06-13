'use client'

import * as z from 'zod'
// import axios from 'axios'
import { startTransition, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Trash, UploadCloud } from 'lucide-react'
import { Billboard, Image } from '@prisma/client'
import { useParams, usePathname, useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'

import { AlertModal } from '@/components/dashboard/modals/alert-modal'
import { Heading } from '@/components/dashboard/Heading'
import { cn } from '@/lib/utils'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import NextImage from 'next/image'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'
import {
  createBillboard,
  deleteBillboard,
  editBillboard,
} from '@/lib/actions/dashboard/billboard'
import { SubmitButton } from '@/components/dashboard/SubmitButton'
import { createBillboardSchema } from '@/lib/schemas/dashboard/billboard'
import ImageSlider from '@/components/dashboard/ImageSlider'

type BillboardFormValues = z.infer<typeof createBillboardSchema>

//if there is any billboard its Billboard, else its null
interface BillboardFormProps {
  //there is a chance to have no initial data and in fact we're creating one.
  initialData: (Billboard & { images: Partial<Image>[] | null }) | null
}

export const BillboardForm: React.FC<BillboardFormProps> = ({
  initialData,
}) => {
  const params = useParams()
  const { storeId } = params
  const billboardId = initialData?.id

  const router = useRouter()
  const path = usePathname()
  const [files, setFiles] = useState<File[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // const [files, setFiles] = useState<File | null>(null)

  //Based on we get "new" or no billboard data, or we get billboardId as params we create or update billboard
  const title = initialData ? 'ویرایش بیلبورد' : 'ایجاد بیلبورد'
  const description = initialData
    ? 'ویرایش بیلبورد.'
    : 'اضافه کردن بیلبورد جدید'
  const toastMessage = initialData ? 'بیلبورد آپدیت شد.' : 'بیلبورد ایجاد شد.'
  const action = initialData ? 'ذخیره تغییرات' : 'ایجاد'

  const form = useForm<BillboardFormValues>({
    resolver: zodResolver(createBillboardSchema),
    //the second part is for 'null' cases
    defaultValues: initialData || {
      label: '',
      // image: null,
    },
  })
  // const [formState, createAction] = useFormState(
  //   createBillboard.bind(null, path, storeId as string),
  //   {
  //     errors: {},
  //   }
  // )
  // const [editFormState, editAction] = useFormState(
  //   editBillboard.bind(null, path, storeId as string, billboardId as string),
  //   {
  //     errors: {},
  //   }
  // )
  const onSubmit = async (data: BillboardFormValues) => {
    // console.log(data)
    const formData = new FormData()

    formData.append('label', data.label)

    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        formData.append('images', data.images[i])
      }
    }

    try {
      if (initialData) {
        // console.log({ data, initialData })
        startTransition(() => {
          editBillboard(
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
              if (res?.errors?.label) {
                form.setError('label', {
                  type: 'custom',
                  message: res?.errors.label?.join(' و '),
                })
              } else if (res?.errors?.images) {
                form.setError('images', {
                  type: 'custom',
                  message: res?.errors.images?.join(' و '),
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
          createBillboard(formData, params.storeId as string, path)
            .then((res) => {
              if (res?.errors?.label) {
                form.setError('label', {
                  type: 'custom',
                  message: res?.errors.label?.join(' و '),
                })
              } else if (res?.errors?.images) {
                form.setError('images', {
                  type: 'custom',
                  message: res?.errors.images?.join(' و '),
                })
              } else if (res?.errors?._form) {
                toast.error(res?.errors?._form?.join(' و '))
              }
            })
            .catch(() => toast.error('مشکلی پیش آمده.'))
        })
      }
    } catch {
      toast.error('مشکلی پیش آمده، لطفا دوباره امتحان کنید!')
    }
  }
  const [deleteState, deleteAction] = useFormState(
    deleteBillboard.bind(null, path, storeId as string, billboardId as string),
    {
      errors: {},
    }
  )

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
        // loading={loading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {/* in case there is initial data it means we want to edit it */}
        {initialData && (
          <Button
            disabled={loading}
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
          onSubmit={form.handleSubmit(onSubmit)}
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
            name="label"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>عنوان</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="عنوان بیلبورد"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* {files ? (
            <div
              // ratio={}
              className="relative mx-auto rounded-lg  h-96 w-96"
            >
              <Image
                alt="billboard-pic"
                // src={files}
                src={URL.createObjectURL(files)}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ) : (
             )} */}
          {/* <FormField
            control={form.control}
            name="image"
            render={({ field: { onChange }, ...field }) => (
              <FormItem>
                <FormLabel
                  className={cn(
                    'max-w-md mx-auto cursor-pointer bg-transparent rounded-xl flex flex-col justify-center gap-4 items-center border-2 border-black/20 dark:border-white/20 border-dashed w-full h-24 shadow ',
                    !!files ? 'hidden' : ''
                  )}
                >
                  <span
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'flex flex-col items-center justify-center gap-2 h-96 w-96'
                    )}
                  >
                    <UploadCloud />
                    انتخاب عکس
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    // formAction={formAction}
                    // {...field}
                    // multiple={true}
                    // disabled={form.formState.isSubmitting}
                    // value={field.value ? [field.value] : []}
                    onChange={async (event) => {
                      event.preventDefault()

                      const file = event.target.files
                        ? event.target.files[0]
                        : null

                      console.log(file)
                      onChange(file)

                      // setFiles(file)
                      form.setValue('image', file)
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setFiles(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </FormControl>

                <FormMessage className="dark:text-rose-400" />
              </FormItem>
            )}
          /> */}

          {/* <div className="md:grid md:grid-cols-3 gap-8"> */}

          {/* </div> */}
          <SubmitButton className="ml-auto">{action}</SubmitButton>
        </form>
      </Form>
    </>
  )
}
