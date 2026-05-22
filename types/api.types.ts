// API request/response types for Next.js API Routes
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
