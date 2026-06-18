import * as z from '@zod/zod'
import type { I_route } from '@local/http-server'
import { segment_body_queue, type I_segment_body_rr } from '#queue/segment/body.ts'
import { user_uploaded_img, throw_parse } from '@local/zod-helper'

const body_schema: z.ZodType<I_segment_body_rr & { order_id: string }> = z.object({
	order_id: z.string(),
	form: z.enum(['mask', 'crop', 'whiteBK', 'normal']),
	image: user_uploaded_img,
})

export
const route__segment_body: I_route = {
	method: 'POST',
	path: '/segment/body',
	handler: async req => {
		const { order_id, ...input } = await throw_parse('/segment/body', req, body_schema)
		const result = await segment_body_queue.push(order_id, input)
		return Response.json(result)
	},
}
