'use client'

import { BounceLoader, ClipLoader } from 'react-spinners'

export const Loader = () => {
  return (
    <div className="z-30 absolute inset-0 w-full h-full flex items-center justify-center">
      <BounceLoader color="" size={50} />
    </div>
  )
}
