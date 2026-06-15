import { I_ai_model } from './type.ts'

export
const I_qwen_img_2_0: I_ai_model = {
	key: 'qwen-image-2.0',
	provider: 'aliyun',
	price: {
		cost: 200_000n,
		sale: 300_000n,
	},
}

export
const I_qwen_img_2_0_pro: I_ai_model = {
	key: 'qwen-image-2.0-pro',
	provider: 'aliyun',
	price: {
		cost: 500_000n,
		sale: 700_000n,
	},
}
