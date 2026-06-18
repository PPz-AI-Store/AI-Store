import type { ZodType } from '@zod/zod'
import { receive_json } from '@ppz/ppz'
import { respond_400 } from '@local/http-server'

export
async function throw_parse<T>(handler_name: string, request: Request, schema: ZodType<T>) {
	const json_result = await receive_json(request)
	if (!json_result.ok) {
		const err = json_result.error
		console.error(`${handler_name}: error on json request body: ${err.key}`)
		console.error(err.error)
		throw respond_400()
	}

	const data = json_result.value
	const z_result = schema.safeParse(data)
	if (!z_result.success) {
		console.error(`${handler_name}: invalid json request body.`, data)
		throw respond_400()
	}
	return z_result.data
}
