import ImageSegClient, { SegmentBodyRequest, type SegmentBodyResponse } from '@alicloud/imageseg20191230'
// import { RuntimeOptions } from '@alicloud/tea-util'
import { segment_body, I_segment_body_form } from '@local/ali-vi-meta'
import { Job_queue, I_rr } from '../_base.ts'
import { get_client_config } from '../_aliyun-util.ts'

export
interface I_segment_body_rr extends I_rr {
	form: I_segment_body_form
}

class Segment_body extends Job_queue<I_segment_body_rr, I_raw_response> {
	private client: ImageSegClient.default
	constructor() {
		super(segment_body)
		this.client = new ImageSegClient.default(
			get_client_config('imageseg.cn-shanghai.aliyuncs.com')
		)
	}
	// 参考“人体分割 api”的在线调试中的 SDK 实例
	protected async exec(input: I_segment_body_rr) {
		const request = new SegmentBodyRequest({
			imageURL: input.image,
			returnForm: input.form,
		})
		const result = await this.client.segmentBody(request)
		const body = validate_body(result)
		return {
			output: body.data.imageURL,
			raw_response: body,
		}
	}
}

interface I_raw_response {
	data: {
		imageURL: string
	}
	requestId: string
}

function validate_body(response: SegmentBodyResponse): I_raw_response {
	const body = response.body
	if (body?.data?.imageURL === undefined || body.requestId === undefined) {
		console.error('unrecognized response format', response)
		throw new Error('unrecognized response format')
	}
	return body as I_raw_response
}

export
const segment_body_queue = new Segment_body()
