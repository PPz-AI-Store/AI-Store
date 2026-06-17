export
type I_ali_vi__key
	= 'segment-body'
	| 'segment-body-hd'
	| 'segment-common'
	| 'segment-common-hd'

export
type I_ali_vi__format
	= 'JPEG'
	| 'PNG'
	| 'BMP'
	| 'WEBP'

export
interface I_ali_vi__input {
	format: I_ali_vi__format[]
	/** alivi 官方文档：不支持8位、16位、64位PNG */
	small_png?: true
	resolution: {
		min?: [number, number]
		max: [number, number]
	}
	size: {
		min?: number
		max: number
	}
}

export
interface I_ali_vi__meta {
	key: I_ali_vi__key
	qps: number
	/** 单位：豪（1 豪 = 0.0001 元） */
	price: bigint
	input: I_ali_vi__input
}

export
interface I_ali_vi__job_result {
	id: number
	order_id: string
	api: I_ali_vi__key

	input: string
	output: string
	raw_request: string
	raw_response: string

	receive_at: Date
	send_at: Date
	finish_at: Date
}
