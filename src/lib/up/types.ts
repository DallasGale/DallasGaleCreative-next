/**
 * Types for the Up Banking API (https://developer.up.com.au).
 * Responses follow JSON:API, so everything is {data, links} with
 * attributes/relationships on each resource.
 */

export type MoneyObject = {
  currencyCode: string
  /** Decimal string, negative for debits. e.g. "-59.98" */
  value: string
  /** Same amount in cents. Use this for arithmetic. */
  valueInBaseUnits: number
}

export type AccountType = "SAVER" | "TRANSACTIONAL" | "HOME_LOAN"
export type OwnershipType = "INDIVIDUAL" | "JOINT"
export type TransactionStatus = "HELD" | "SETTLED"

export type UpAccount = {
  type: "accounts"
  id: string
  attributes: {
    displayName: string
    accountType: AccountType
    ownershipType: OwnershipType
    balance: MoneyObject
    createdAt: string
  }
}

type ToOne<T extends string> = {data: {type: T; id: string} | null}
type ToMany<T extends string> = {data: {type: T; id: string}[]}

export type UpTransaction = {
  type: "transactions"
  id: string
  attributes: {
    status: TransactionStatus
    description: string
    rawText: string | null
    message: string | null
    isCategorizable: boolean
    amount: MoneyObject
    foreignAmount: MoneyObject | null
    settledAt: string | null
    createdAt: string
    transactionType: string | null
    roundUp: {amount: MoneyObject; boostPortion: MoneyObject | null} | null
    cashback: {description: string; amount: MoneyObject} | null
    note: {text: string} | null
  }
  relationships: {
    account: ToOne<"accounts">
    /** Non-null when this is a transfer between the customer's own accounts. */
    transferAccount: ToOne<"accounts">
    category: ToOne<"categories">
    parentCategory: ToOne<"categories">
    tags: ToMany<"tags">
  }
}

export type UpCategory = {
  type: "categories"
  id: string
  attributes: {name: string}
  relationships: {
    parent: ToOne<"categories">
    children: ToMany<"categories">
  }
}

export type UpListResponse<T> = {
  data: T[]
  links: {prev: string | null; next: string | null}
}

export type UpErrorResponse = {
  errors: {
    status: string
    title: string
    detail: string
    source?: {parameter?: string; pointer?: string}
  }[]
}

export type UpPingResponse = {
  meta: {id: string; statusEmoji: string}
}
