/**
 * 获取 API 基础 URL
 * 确保使用与当前页面相同的协议，避免混合内容错误
 */

export function getApiUrl(path: string): string {
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 获取当前页面的协议和主机
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // 拼接完整 URL
  return `${origin}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * 封装 fetch，自动处理 URL 协议
 */
export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(getApiUrl(url), options);
}
