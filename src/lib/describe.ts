import { CATEGORY_LABEL, type Item } from './schema'

/** "a cheese · dairy & eggs · fridge" */
export const describe = (i: Item) =>
  [i.kind ? `a ${i.kind}` : null, CATEGORY_LABEL[i.category], i.location].filter(Boolean).join(' · ')
