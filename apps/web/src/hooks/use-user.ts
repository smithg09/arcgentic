import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers } from '@/api/graphql/queries'
import { createUser } from '@/api/graphql/mutations'
import type { CreateUserDto, User } from '@/types/graphql'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCurrentUser() {
  const { data: users, isLoading, error } = useUsers()
  // Pick first user (auth is planned later)
  const user: User | null = users?.[0] ?? null
  return { user, isLoading, error, hasUsers: (users?.length ?? 0) > 0 }
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserDto) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
