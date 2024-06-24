import { z } from 'zod'

const MAX_FILE_SIZE = 5000000
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'عنوان باید بیش از یک حرف باشد.' })
    .regex(/^[\u0600-\u06FFa-zA-Z0-9_ ]+$/, {
      message: 'تنها حروف، اعداد و آندرلاین برای اسم مجاز است.',
    })
    .max(128, { message: 'نام شخص نمی‌تواند بیش از 128 حرف باشد.' }),

  description: z
    .string()
    // .min(1, { message: 'توضیحات باید بیش از یک حرف باشد.' })
    // .regex(/^[\u0600-\u06FFa-zA-Z0-9_ ]+$/, {
    //   message: 'تنها حروف، اعداد و آندرلاین برای اسم مجاز است.',
    // })
    .max(1536, { message: 'توضیحات نمی‌تواند بیش از 1536 حرف باشد.' })
    .optional(),

  price: z.coerce
    .number()
    .min(0, { message: 'این قسمت نمی‌تواند خالی باشد' })
    .max(1000000000, {
      message: 'قیمت محصول نمی‌تواند بیش از یک میلیارد باشد.',
    }),
  caffeine: z.coerce
    .number()
    .min(0, { message: 'این قسمت نمی‌تواند خالی باشد' })
    .max(1000000000, {
      message: 'قیمت محصول نمی‌تواند بیش از یک میلیارد باشد.',
    })
    .optional(),
  sugarContent: z.coerce
    .number()
    .min(0, { message: 'این قسمت نمی‌تواند خالی باشد' })
    .max(1000000000, {
      message: 'قیمت محصول نمی‌تواند بیش از یک میلیارد باشد.',
    })
    .optional(),
  isHot: z.boolean().optional(),
  isDairy: z.boolean().optional(),
  ingredientIds: z.array(z.string()).optional(),
  categoryId: z
    .string()
    .min(1, { message: 'یک دسته‌بندی را انتخاب کنید.' })
    .max(512, { message: 'این قسمت نمی‌تواند بیش از 512 باشد' }),
  images: z
    .any()
    // .custom<FileList>(
    //   (val) => val instanceof FileList,
    //   'قسمت عکس نمی‌تواند خالی باشد'
    // )
    // .refine((files) => files.length > 0, `قسمت عکس نمی‌تواند خالی باشد`)
    // .refine((files) => files.length <= 5, `حداکثر 5 عکس مجاز است.`)
    // .refine(
    //   (files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
    //   `هر فایل باید کمتر از 5 مگابایت باشد`
    // )
    // .refine(
    //   (files) =>
    //     Array.from(files).every((file) =>
    //       ACCEPTED_IMAGE_TYPES.includes(file.type)
    //     ),
    //   'تنها این فرمتها مجاز است: .jpg, .jpeg, .png and .webp'
    // )
    .optional(),
  isFeatured: z.boolean().optional(),
  isArchived: z.boolean().optional(),
})
export const createServerProductSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'عنوان باید بیش از یک حرف باشد.' })
    .regex(/^[\u0600-\u06FFa-zA-Z0-9_ ]+$/, {
      message: 'تنها حروف، اعداد و آندرلاین برای اسم مجاز است.',
    })
    .max(128, { message: 'نام شخص نمی‌تواند بیش از 128 حرف باشد.' }),

  description: z
    .string()
    // .min(1, { message: 'توضیحات باید بیش از یک حرف باشد.' })
    // .regex(/^[\u0600-\u06FFa-zA-Z0-9_ ]+$/, {
    //   message: 'تنها حروف، اعداد و آندرلاین برای اسم مجاز است.',
    // })
    .max(1536, { message: 'توضیحات نمی‌تواند بیش از 1536 حرف باشد.' })
    .optional(),

  caffeine: z.coerce
    .number()
    .min(0, { message: 'این قسمت نمی‌تواند خالی باشد' })
    .max(1000000000, {
      message: 'قیمت محصول نمی‌تواند بیش از یک میلیارد باشد.',
    })
    .optional(),
  sugarContent: z.coerce
    .number()
    .min(0, { message: 'این قسمت نمی‌تواند خالی باشد' })
    .max(1000000000, {
      message: 'قیمت محصول نمی‌تواند بیش از یک میلیارد باشد.',
    })
    .optional(),

  price: z.coerce
    .number()
    .min(0, { message: 'این قسمت نمی‌تواند خالی باشد' })
    .max(1000000000, {
      message: 'قیمت محصول نمی‌تواند بیش از یک میلیارد باشد.',
    }),
  isHot: z.string().optional(),
  isDairy: z.string().optional(),

  categoryId: z
    .string()
    .min(1, { message: 'یک دسته‌بندی را انتخاب کنید.' })
    .max(512, { message: 'این قسمت نمی‌تواند بیش از 512 باشد' }),
  images: z
    .any()
    // .custom<FileList>(
    //   (val) => val instanceof FileList,
    //   'قسمت عکس نمی‌تواند خالی باشد'
    // )
    // .refine((files) => files.length > 0, `قسمت عکس نمی‌تواند خالی باشد`)
    // .refine((files) => files.length <= 5, `حداکثر 5 عکس مجاز است.`)
    // .refine(
    //   (files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
    //   `هر فایل باید کمتر از 5 مگابایت باشد`
    // )
    // .refine(
    //   (files) =>
    //     Array.from(files).every((file) =>
    //       ACCEPTED_IMAGE_TYPES.includes(file.type)
    //     ),
    //   'تنها این فرمتها مجاز است: .jpg, .jpeg, .png and .webp'
    // )
    .optional(),
  isFeatured: z.string().optional(),
  isArchived: z.string().optional(),
})
