// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      user_id: string
      name: string
      description: string
      is_on_diet: boolean
      date: string
      created_at: string
    }
    users: {
      id: string
      session_id?: string
      name: string
      imgUrl?: string
      email: string
      created_at: string
    }
  }
}
