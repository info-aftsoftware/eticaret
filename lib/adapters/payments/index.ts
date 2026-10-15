/**
 * Payment Adapter Factory
 * Returns the appropriate payment adapter based on provider name
 */

import { PaymentAdapter } from './base'
import { PayTRAdapter } from './paytr'
import { IyzicoAdapter } from './iyzico'

export type PaymentProvider = 'paytr' | 'iyzico'

export function getPaymentAdapter(provider: PaymentProvider): PaymentAdapter {
  switch (provider) {
    case 'paytr':
      return new PayTRAdapter()
    case 'iyzico':
      return new IyzicoAdapter()
    default:
      throw new Error(`Unknown payment provider: ${provider}`)
  }
}

export type { PaymentAdapter, PaymentInitInput, PaymentInitResult, PaymentWebhookResult } from './base'

