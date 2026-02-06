import { Injectable } from '@nestjs/common';

@Injectable()
export class SettlementService {
  calculateSettlement(params: {
    isCOD: boolean;
    codCollectedAmount?: number;
    shippingCost: number;
  }): { codCommission: number; settlementAmount: number } {
    const { isCOD, codCollectedAmount, shippingCost } = params;

    if (isCOD && codCollectedAmount) {
      const codCommission = Math.min(codCollectedAmount * 0.0001, 25);
      const settlementAmount =
        codCollectedAmount - shippingCost - codCommission;
      return { codCommission, settlementAmount };
    }

    return { codCommission: 0, settlementAmount: -shippingCost };
  }
}
