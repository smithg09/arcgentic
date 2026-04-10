import { GQL_ENDPOINT } from './constants'

class GraphQLError extends Error {
  errors: Array<{ message: string }>
  constructor(errors: Array<{ message: string }>) {
    super(errors.map(e => e.message).join(', '))
    this.errors = errors
    this.name = 'GraphQLError'
  }
}

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`)
  }

  const json = await res.json()

  if (json.errors?.length) {
    throw new GraphQLError(json.errors)
  }

  return json.data as T
}
