import { NextRequest, NextResponse } from "next/server";
import { verifyAlipayNotify } from "@/lib/alipay";
import { payOrderWithAlipay, completeRecharge } from "@/lib/orders";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  if (!verifyAlipayNotify(params)) {
    return new NextResponse("fail", { status: 400 });
  }

  const tradeStatus = params.trade_status;
  if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
    return new NextResponse("success");
  }

  const outTradeNo = params.out_trade_no;
  const tradeNo = params.trade_no;

  try {
    if (outTradeNo.startsWith("recharge_")) {
      const rechargeId = outTradeNo.replace("recharge_", "");
      await completeRecharge(rechargeId, tradeNo);
    } else {
      await payOrderWithAlipay(outTradeNo, tradeNo);
    }
    return new NextResponse("success");
  } catch (err) {
    console.error("[alipay notify]", err);
    return new NextResponse("fail", { status: 500 });
  }
}
