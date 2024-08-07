'use client'

import ImageSlider from '@/components/ImageSlider'
// import Error from "@/components/Error";
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import useMount from '@/hooks/useMount'
import { createPost } from '@/lib/actions/social/post.action'
// import { createPost } from "@/lib/actions";
import { CreatePost } from '@/lib/schemas/social/schemas'
// import { uploadToS3 } from '@/lib/uploadToS3'
import { cn } from '@/lib/utils'
// import { UploadButton } from "@/lib/uploadthing";
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { ElementRef, startTransition, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

function CreatePage() {
  const pathname = usePathname()
  const isCreatePage = pathname === '/social/create'
  const router = useRouter()
  const mount = useMount()
  const [files, setFiles] = useState<File[]>([])
  const closeRef = useRef<ElementRef<'button'>>(null)

  const form = useForm<z.infer<typeof CreatePost>>({
    resolver: zodResolver(CreatePost),
    defaultValues: {
      caption: '',
      fileUrls: undefined,
    },
  })
  // const fileUrls = form.watch('fileUrls')
  // const fileUrls = form.getFieldState('fileUrls')

  const validUrls = files
    .map((file) => URL.createObjectURL(file))
    .filter(Boolean) as string[]

  if (!mount) return null

  return (
    <div>
      <Dialog
        open={isCreatePage}
        onOpenChange={(open) => !open && router.back()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">ایجاد پست جدید</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              // action={action}
              onSubmit={form.handleSubmit(async (values) => {
                const formData = new FormData()

                if (values.fileUrls && values.fileUrls.length > 0) {
                  for (let i = 0; i < values.fileUrls.length; i++) {
                    formData.append('fileUrls', values.fileUrls[i])
                  }
                }

                formData.append('caption', values.caption || '')
                try {
                  startTransition(() => {
                    createPost(formData)
                      .then((res) => {
                        if (res?.errors.caption) {
                          form.setError('caption', {
                            type: 'custom',
                            message: res?.errors.caption?.join(' و '),
                          })
                        } else if (res?.errors?.fileUrls) {
                          form.setError('fileUrls', {
                            type: 'custom',
                            message: res?.errors.fileUrls?.join(' و '),
                          })
                        } else if (res?.errors?._form) {
                          toast.error(res?.errors?._form?.join(' و '))
                        }
                      })
                      .catch(() => toast.error('مشکلی پیش آمده.'))
                  })
                  // const postCreationResult = await createPost({
                  //   caption: values.caption,
                  // })
                  // if (!postCreationResult) {
                  //   return toast.error('مشکلی پیش آمده')
                  // }
                  // // for (const file of files) {
                  // //   await uploadToS3(file, postCreationResult.id)
                  // // }
                  // toast.success('پست ایجاد شد')
                  // form.reset()
                  // setFiles([])
                  // closeRef.current?.click()
                  // router.push('/social')
                } catch (error) {
                  console.log(error)
                  return toast.error('مشکلی پیش آمده')
                }
              })}
              className="space-y-4"
            >
              {files.length > 0 ? (
                <div className="h-96 md:h-[450px] overflow-hidden rounded-md">
                  <AspectRatio ratio={1 / 1} className="relative h-full">
                    <ImageSlider urls={validUrls} />
                  </AspectRatio>
                </div>
              ) : (
                // <FormField
                //   control={form.control}
                //   name="fileUrl"
                //   render={({ field, fieldState }) => (
                //     <FormItem>
                //       <FormLabel htmlFor="picture">تصویر</FormLabel>
                //       <FormControl>
                //         {/* <UploadButton
                //           endpoint="imageUploader"
                //           onClientUploadComplete={(res) => {
                //             form.setValue("fileUrl", res[0].url);
                //             toast.success("Upload complete");
                //           }}
                //           onUploadError={(error: Error) => {
                //             console.error(error);
                //             toast.error("Upload failed");
                //           }}
                //         /> */}
                //       </FormControl>
                //       <FormDescription>
                //         تصویر پست را آپلود کنید.
                //       </FormDescription>
                //       <FormMessage />
                //     </FormItem>
                //   )}
                // />
                <FormField
                  control={form.control}
                  name="fileUrls"
                  render={({ field: { onChange }, ...field }) => (
                    <FormItem>
                      <FormLabel className="mx-auto cursor-pointer bg-transparent rounded-xl flex flex-col justify-center gap-4 items-center border-2 border-black/20 dark:border-white/20 border-dashed w-full h-24 shadow  ">
                        {/* <FileUp size={42} className=" " /> */}
                        <span
                          className={cn(buttonVariants({ variant: 'ghost' }))}
                        >
                          انتخاب عکس یا ویدئو
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
                      <FormMessage className="dark:text-rose-400" />
                    </FormItem>
                  )}
                />
              )}

              {files.length > 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="caption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="caption">کپشن</FormLabel>
                        <FormControl>
                          <Textarea
                            // type="caption"
                            id="caption"
                            // placeholder="Write a caption..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogClose ref={closeRef} asChild>
                    <Button
                      className=""
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {'ایجاد پست'}
                      {form.formState.isSubmitting && (
                        <Loader className="animate-spin  " />
                      )}
                    </Button>
                  </DialogClose>
                </>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreatePage
