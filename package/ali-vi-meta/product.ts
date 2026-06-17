import type { I_ali_vi__meta } from './type.ts'

const mb = (unit: number) => unit * 1024 * 1024

export
type I_segment_body_form
	= 'mask' // 单通道黑白图
	| 'crop' // 剪裁之后的 png
	| 'whiteBK' // 白底图
	| 'abc' // 不填或其他值返回四通道 png

/** 人体分割 */
export
const segment_body: I_ali_vi__meta = {
	key: 'segment-body',
	qps: 5,
	price: 20n,
	input: {
		format: ['JPEG', 'PNG', 'BMP', 'WEBP'],
		small_png: true,
		resolution: {
			max: [2000, 2000],
		},
		size: {
			max: mb(3),
		},
	}
}

/** 高清人体分割 */
export
const segment_body_hd: I_ali_vi__meta = {
	key: 'segment-body-hd',
	qps: 2,
	price: 70n,
	input: {
		format: ['JPEG', 'PNG', 'BMP'],
		resolution: {
			min: [32, 32],
			max: [6000, 6000],
		},
		size: {
			max: mb(40),
		},
	},
}

/** 通用分割 */
export
const segment_common: I_ali_vi__meta = {
	key: 'segment-common',
	qps: 5,
	price: 20n,
	input: {
		format: ['JPEG', 'PNG', 'BMP', 'WEBP'],
		small_png: true,
		resolution: {
			min: [32, 32],
			max: [1999, 1999],
		},
		size: {
			max: mb(3),
		},
	},
}

/** 高清通用分割 */
export
const segment_common_hd: I_ali_vi__meta = {
	key: 'segment-common-hd',
	qps: 2,
	price: 70n,
	input: {
		format: ['JPEG', 'PNG', 'BMP'],
		resolution: {
			min: [32, 32],
			max: [10_000, 10_000],
		},
		size: {
			max: mb(40),
		},
	}
}
