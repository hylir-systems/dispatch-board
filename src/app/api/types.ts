/**
 * 看板航班分页查询参数
 */
export interface DispatchBoardPageParams {
  page?: number;
  size?: number;
  sheetNo?: string;
  riskFlag?: string;
  riskLevel?: string;
  supplyType?: string;
  isDelivered?: number;
  hasReceipt?: boolean;
  startTime?: string;
  endTime?: string;
  mappingTime?: string;
  mappingTimeEnd?: string;
  receiptUploadTime?: string;
  receiptUploadTimeEnd?: string;
  lastRecRequireTimeStart?: string;
  lastRecRequireTimeEnd?: string;
  deliveryRecNo?: string;
  deliveryRecName?: string;
  hasReleased?: boolean;
  releasedTimeStart?: string;
  releasedTimeEnd?: string;
  releasedBy?: string;
  shippingFactoryId?: string;
  shippingFactoryCode?: string;
  shippingFactoryName?: string;
}

/**
 * 看板航班数据
 */
export interface DispatchBoardFlightVO {
  supplyType?: string;
  sheetNo?: string;
  gmtCreate?: string;
  lastRecRequireTime?: string;
  deliveryRecNo?: string;
  deliveryRecName?: string;

  // 发货工厂信息
  shippingFactoryId?: string;
  shippingFactoryCode?: string;
  shippingFactoryName?: string;

  mappingTime?: string;
  isDelivered?: boolean;
  releasedTime?: string;
  releasedBy?: string;
  hasReleased?: boolean;

  hasReceipt?: boolean;
  receiptUploadTime?: string;
  receiptUrl?: string;
  riskFlag?: string;
  riskLevel?: string;
}

/**
 * 看板航班分页结果
 */
export interface DispatchBoardFetchResult {
  content: DispatchBoardFlightVO[];
  totalElements: number;
  number: number;
  size: number;
  totalPages: number;
  numberOfElements: number;
}

/**
 * 工厂信息
 */
export interface FactoryInfo {
  factoryId?: string;
  factoryCode?: string;
  factoryName?: string;
  factoryShortName?: string;
}
