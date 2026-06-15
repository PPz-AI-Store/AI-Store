import { I_product__llm } from './type.ts'
import { qwen_img_2_0, qwen_img_2_0_pro } from './model.ts'

export
const img__remove_passersby: I_product__llm = {
	key: 'img__remove_passersby',
	title: '擦除景区路人',
	enable: false,
	model: [
		qwen_img_2_0,
		qwen_img_2_0_pro,
	],
}

export
const img__make_ID_photo: I_product__llm = {
	key: 'img__make_ID_photo',
	title: '制作证件照',
	enable: false,
	model: [
		qwen_img_2_0,
		qwen_img_2_0_pro,
	],
}

export
const img__common_gen_edit_img: I_product__llm = {
	key: 'img__common_gen_edit_img',
	title: '通用图片生成/编辑',
	enable: false,
	model: [
		qwen_img_2_0,
		qwen_img_2_0_pro,
	],
}
