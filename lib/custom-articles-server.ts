import type { Article } from './types'

// 服务端获取custom article - 仅在服务端渲染时可用
// 注意：custom文章存储在localStorage，服务端无法直接访问
// 此函数用于generateMetadata，实际数据在客户端组件中获取
export function getCustomArticleServer(id: string): Article | null {
  // 服务端无法访问localStorage，返回null
  // 客户端组件会负责获取实际数据
  return null
}
