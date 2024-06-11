'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import useMount from '@/hooks/useMount'

import { updatePost } from '@/lib/actions/social/post.action'
import { UpdatePost } from '@/lib/schemas/social/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { Post } from '@prisma/client'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

function EditPost({ id, post }: { id: string; post: Post }) {
  const mount = useMount()
  const pathname = usePathname()
  const isEditPage = pathname === `/social/p/${id}/edit`
  const router = useRouter()
  const form = useForm<z.infer<typeof UpdatePost>>({
    resolver: zodResolver(UpdatePost),
    defaultValues: {
      id: post.id,
      caption: post.caption || '',
      // fileUrls: post.fileUrls,
    },
  })
  // const fileUrl = form.watch("fileUrls");

  if (!mount) return null

  return (
    <Dialog open={isEditPage} onOpenChange={(open) => !open && router.back()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right opacity-70 ">
            ویرایش متن پست
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(async (values) => {
              const formData = new FormData()
              formData.append('caption', values.caption || '')
              formData.append('id', id)
              try {
                startTransition(() => {
                  updatePost(formData)
                    .then((res) => {
                      if (res?.errors?.caption) {
                        form.setError('caption', {
                          type: 'custom',
                          message: res?.errors.caption?.join(' و '),
                        })
                      } else if (res?.errors?._form) {
                        toast.error(res?.errors?._form?.join(' و '))
                      }
                    })
                    .catch(() => toast.error('مشکلی پیش آمده.'))
                })
              } catch (error) {
                console.log(error)
                return toast.error('مشکلی پیش آمده')
              }
            })}
          >
            {/* <div className="h-96 md:h-[450px] overflow-hidden rounded-md">
              <AspectRatio ratio={1 / 1} className="relative h-full">
                <Image
                  src={fileUrl}
                  alt="Post preview"
                  fill
                  className="rounded-md object-cover"
                />
              </AspectRatio>
            </div> */}

            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="caption">کپشن</FormLabel>
                  <FormControl>
                    <Input
                      type="caption"
                      id="caption"
                      placeholder="یک کپشن بنویسید..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              ویرایش
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditPost
