import type {
  DispatchBoardPageParams,
  FactoryInfo,
  DispatchBoardFetchResult,
  DispatchBoardFlightVO,
} from './types';
import { fetchHttp } from '../utils/fetch';

/**
 * API 请求说明：
 *
 * 统一使用相对路径，通过代理服务器转发请求：
 * - 开发环境 (npm run dev): Vite 代理 → http://192.168.0.85:3680
 * - 生产环境 (Nginx):      Nginx 代理 → http://117.143.214.90:3680
 *
 * 请求路径示例: /api/hylir-mes-center/...
 */

/**
 * 获取看板航班分页数据
 * @param params 查询参数
 * @returns 分页结果
 */
export async function fetchDispatchBoard(
  params: DispatchBoardPageParams
): Promise<DispatchBoardFetchResult> {
  const url = `/api/hylir-mes-center/api/v1/integration/chery/board/dispatch/list`;

  try {
    const data = await fetchHttp.post<{
      content?: DispatchBoardFlightVO[];
      items?: DispatchBoardFlightVO[];
      totalElements?: number;
      total?: number;
      number: number;
      size: number;
      totalPages: number;
      numberOfElements: number;
    }>(url, params);

    return {
      content: data?.content || data?.items || [],
      totalElements: data?.totalElements || data?.total || 0,
      number: data?.number || 0,
      size: data?.size || 0,
      totalPages: data?.totalPages || 0,
      numberOfElements: data?.numberOfElements || 0,
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
  const url = `/api/hylir-masterdata-center/api/v1/manage/factory/getInfoByFactoryCode?factoryCode=${encodeURIComponent(factoryCode)}`;

  try {
    return await fetchHttp.get<FactoryInfo>(url);
  } catch (error) {
    console.error('获取工厂信息失败:', error);
    throw error;
  }
}
