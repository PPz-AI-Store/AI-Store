import { AlipaySdk } from "alipay-sdk";

function getAlipaySdk() {
  const appId = process.env.ALIPAY_APP_ID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;
  if (!appId || !privateKey || !alipayPublicKey) {
    return null;
  }
  return new AlipaySdk({
    appId,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    alipayPublicKey: alipayPublicKey.replace(/\\n/g, "\n"),
    gateway:
      process.env.ALIPAY_GATEWAY ??
      "https://openapi.alipay.com/gateway.do",
  });
}

export function isAlipayConfigured(): boolean {
  return getAlipaySdk() !== null;
}

export async function createAlipayPagePay(params: {
  outTradeNo: string;
  totalAmount: number;
  subject: string;
  returnUrl: string;
  notifyUrl: string;
}): Promise<string> {
  const sdk = getAlipaySdk();
  if (!sdk) throw new Error("ALIPAY_NOT_CONFIGURED");

  const result = await sdk.pageExecute("alipay.trade.page.pay", "GET", {
    bizContent: {
      out_trade_no: params.outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: params.totalAmount.toFixed(2),
      subject: params.subject,
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl,
  });

  return result as string;
}

export function verifyAlipayNotify(
  postData: Record<string, string>,
): boolean {
  const sdk = getAlipaySdk();
  if (!sdk) return false;
  return sdk.checkNotifySign(postData);
}
