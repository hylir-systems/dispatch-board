import type { DispatchBoardPageParams, FactoryInfo, DispatchBoardFetchResult } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDev = (import.meta as any).DEV;

/**
 * API 基础地址
 * 开发环境：使用相对路径（通过 Vite 代理）
 * 生产环境：需要配置完整的 API 地址
 */
const API_BASE_URL = isDev
  ? '' // 开发环境使用相对路径，通过 vite.config.ts 代理
  : (import.meta as any).env?.VITE_API_BASE_URL || '';

/**
 * 获取看板航班分页数据（内部解包统一返回）
 * @param params 查询参数
 * @returns 分页结果
 */
export async function fetchDispatchBoard(
  params: DispatchBoardPageParams
): Promise<DispatchBoardFetchResult> {
  const url = `${API_BASE_URL}/api/hylir-mes-center/api/v1/integration/chery/board/dispatch/list`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // 后端统一返回结构: { code, msg, data: {...} }，解包取出 data
    const pageData = result?.data || {};
    return {
      content: pageData.content || pageData.items || [],
      totalElements: pageData.totalElements || pageData.total || 0,
      number: pageData.number || 0,
      size: pageData.size || 0,
      totalPages: pageData.totalPages || 0,
      numberOfElements: pageData.numberOfElements || 0,
    };
  } catch (error) {
    console.error('获取看板数据失败:', error);
    throw error;
  }
}

/**
 * 根据工厂编码获取工厂信息
 * @param factoryCode 工厂编码
 * @returns 工厂信息
 */
export async function getInfoByFactoryCodeApi(factoryCode: string): Promise<FactoryInfo> {
  const url = `${API_BASE_URL}/api/hylir-masterdata-center/api/v1/manage/factory/getInfoByFactoryCode?factoryCode=${encodeURIComponent(factoryCode)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取工厂信息失败:', error);
    throw error;
  }
}
