import React from 'react'
import { Lang } from '../Helper/i18n'
import SlotForms from '../components/Forms/SlotForms'
import SlotGenerativHandle from '../components/SlotGenerativHandle'

interface Props {
  lang: Lang
}

export default function TestPage({ lang }: Props) {
  return (
    <div className="w-[80%] mx-auto bg-white p-6 rounded-md shadow-sm mt-4">
      <SlotGenerativHandle />
    </div>
  )
}
