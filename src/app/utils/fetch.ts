/**
 * 统一 API 请求工具
 * 
 * 功能：
 * - GET 请求自动添加时间戳 `_t=` 防止浏览器缓存
 * - 自动解包后端返回的 { code, msg, data } 结构
 * - 统一错误处理
 * - 失败自动重试
 * - 支持 Base URL
 * 
 * 使用方式：
 * import { fetchHttp } from '@/app/utils/fetch';
 * const data = await fetchHttp.get('/api/users');
 */

export interface ApiResponse<T = unknown> {
  code: number | string;
  msg: string;
  data: T;
}

export interface FetchOptions extends RequestInit {
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number;
  /** 是否解包数据，默认 true */
  unwrap?: boolean;
  /** 失败重试次数，默认 3 */
  retry?: number;
  /** 重试间隔时间（毫秒），默认 1000 */
  retryDelay?: number;
  /** 是否携带 Token，默认 false */
  withToken?: boolean;
  /** 基础 URL，会自动拼接 */
  baseUrl?: string;
}

/**
 * 从 Cookie 中读取 Token
 */
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null; // SSR 保护
  
  const name = 'token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 自定义错误类
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public code?: string | number,
    public status?: number,
    public requestId?: string,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * 统一 API 请求类
 * 使用方式: fetchHttp.get() / fetchHttp.post() / fetchHttp.put() / fetchHttp.patch() / fetchHttp.delete()
 */
class FetchHttp {
  private defaultTimeout = 30000;
  private defaultRetry = 3;
  private defaultRetryDelay = 1000;
  private baseUrl = '';

  /**
   * 设置基础 URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, ''); // 移除末尾斜杠
  }

  /**
   * 获取当前基础 URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 拼接完整 URL
   */
  private buildUrl(url: string, baseUrl?: string): string {
    const finalBaseUrl = baseUrl || this.baseUrl;
    if (finalBaseUrl && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
      return `${finalBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  }

  /**
   * 统一请求核心方法（包含重试逻辑）
   */
  private async request<T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const requestId = generateRequestId();
    
    // URL 校验
    if (!url || typeof url !== 'string') {
      throw new FetchError('请求 URL 不能为空', undefined, undefined, requestId);
    }

    // 构建完整 URL
    const finalUrl = this.buildUrl(url, options.baseUrl);

    const {
      timeout = this.defaultTimeout,
      unwrap = true,
      method = 'GET',
      headers = {},
      retry = this.defaultRetry,
      retryDelay = this.defaultRetryDelay,
      withToken = false,
      ...restOptions
    } = options;

    // 处理 Token
    let authHeaders: Record<string, string> = {};
    if (withToken) {
      const token = getTokenFromCookie();
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // GET 请求添加时间戳防止缓存
    let requestUrl = finalUrl;
    if (method === 'GET') {
      const separator = finalUrl.includes('?') ? '&' : '?';
      requestUrl = `${finalUrl}${separator}_t=${Date.now()}`;
    }

    // 重试循环
    let lastError: Error | unknown;
    
    for (let attempt = 0; attempt <= retry; attempt++) {
      // 创建超时 AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(requestUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': requestId, // 请求追踪 ID
            ...authHeaders,
            ...headers,
          },
          signal: controller.signal,
          ...restOptions,
        });

        clearTimeout(timeoutId);

        // 处理 HTTP 错误状态码
        if (!response.ok) {
          // 4xx 客户端错误不重试
          if (response.status >= 400 && response.status < 500) {
            throw new FetchError(
              `请求错误: ${response.status} ${response.statusText}`,
              undefined,
              response.status,
              requestId
            );
          }
          // 5xx 服务器错误可以重试
          throw new FetchError(
            `服务器错误: ${response.status} ${response.statusText}`,
            undefined,
            response.status,
            requestId,
            true // 视为网络错误，可重试
          );
        }

        // 处理空响应
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // 非 JSON 响应
          if (unwrap) {
            // 如果需要解包但返回非 JSON，尝试返回原始内容
            const text = await response.text();
            return text as unknown as T;
          }
          return await response.json() as T;
        }

        const result = await response.json();

        // 解包数据 - code 可能是字符串 "200" 或数字 200
        if (unwrap) {
          // 校验返回结构
          if (result && typeof result !== 'object') {
            throw new FetchError(
              '响应格式错误: 期望 JSON 对象',
              undefined,
              response.status,
              requestId
            );
          }

          const code = result.code;
          const isSuccess = code === 0 || code === 200 || code === '0' || code === '200' || code === 'success';
          if (!isSuccess) {
            throw new FetchError(
              result.msg || `API Error: ${code}`,
              code,
              response.status,
              requestId
            );
          }
          return result.data;
        }

        return result as T;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // 如果是 FetchError 且不是网络错误，不重试
        if (error instanceof FetchError && !error.isNetworkError) {
          throw error;
        }

        lastError = error;

        // 如果还有重试次数，等待后继续
        if (attempt < retry) {
          // 判断是否需要重试（网络错误或 5xx 错误）
          const isRetryable = this.isRetryableError(error);
          if (isRetryable) {
            console.warn(`[${requestId}] 请求失败，${retryDelay}ms 后进行第 ${attempt + 2}/${retry + 1} 次重试...`);
            await this.sleep(retryDelay);
            continue;
          }
        }

        // 不重试或已达到最大重试次数，抛出错误
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new FetchError('请求超时', undefined, undefined, requestId);
          }
          if (error instanceof FetchError) {
            throw error;
          }
          // 其他错误包装为 FetchError
          throw new FetchError(error.message, undefined, undefined, requestId, true);
        }
        
        throw new FetchError('未知错误', undefined, undefined, requestId, true);
      }
    }

    // 理论上不会到达这里，但为了类型安全
    if (lastError instanceof FetchError) {
      throw lastError;
    }
    throw new FetchError('请求失败', undefined, undefined, requestId, true);
  }

  /**
   * 判断错误是否需要重试
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof FetchError) {
      return error.isNetworkError;
    }
    
    if (error instanceof Error) {
      // 网络错误、超时等
      return (
        error.message.includes('fetch failed') ||
        error.message.includes('network') ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')
      );
    }
    return false;
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 序列化查询参数（类似 qs）
   * - 过滤 null 和 undefined
   * - 数组使用 repeat 格式（key=1&key=2）
   */
  private serializeParams(params: Record<string, string | number | boolean | undefined | (string | number | boolean)[] | null>): string {
    if (!params || typeof params !== 'object') {
      return '';
    }

    const parts: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return; // 跳过 null 和 undefined
      }

      if (Array.isArray(value)) {
        // 过滤数组中的 null 和 undefined
        const filteredItems = value.filter(item => item !== null && item !== undefined);
        // 数组：key=1&key=2 格式
        filteredItems.forEach((item) => {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        });
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });

    return parts.join('&');
  }

  /**
   * GET 请求 - 带时间戳防缓存
   */
  async get<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean | undefined | (string | number | boolean)[] | null>,
    options?: Omit<FetchOptions, 'method'>
  ): Promise<T> {
    let requestUrl = url;
    
    // 序列化查询参数
    if (params) {
      const queryString = this.serializeParams(params);
      if (queryString) {
        const separator = url.includes('?') ? '&' : '?';
        requestUrl = `${url}${separator}${queryString}`;
      }
    }

    // 添加时间戳防止缓存
    const tsSeparator = requestUrl.includes('?') ? '&' : '?';
    requestUrl = `${requestUrl}${tsSeparator}_t=${Date.now()}`;

    return this.request<T>(requestUrl, { method: 'GET', ...options });
  }

  /**
   * POST 请求 - 新增资源
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    options?: Omit<FetchOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT 请求 - 完整更新资源
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    options?: Omit<FetchOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PATCH 请求 - 部分更新资源
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    options?: Omit<FetchOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE 请求 - 删除资源
   */
  async delete<T = unknown>(
    url: string,
    options?: Omit<FetchOptions, 'method'>
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      ...options,
    });
  }
}

/** 单例实例 */
export const fetchHttp = new FetchHttp();
