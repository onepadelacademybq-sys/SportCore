// Domain types for One Padel — derived from DATABASE.md schema
import type { ROLES, PADEL_LEVELS, SESSION_BLOCK_TYPES } from '@/lib/constants'

export type UserRole = (typeof ROLES)[keyof typeof ROLES]
export type PadelLevel = (typeof PADEL_LEVELS)[number]
export type SessionBlockType = (typeof SESSION_BLOCK_TYPES)[number]
