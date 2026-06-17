import { assert } from '@std/assert'
import { app_env } from '@local/env'
import { Client } from '@db/postgres'
import type { I_ali_vi__key } from '@local/ali-vi-meta'

export
type I_job_status = 'pending' | 'processing' | 'finished' | 'failed'

/** single connection */
const db = new Client(app_env.database.ali_vi_job.url)
await db.connect()

export
async function new_job(order_id: string, api: I_ali_vi__key, input: string, raw_request: string) {
	const result = await db.queryObject<{ id: number }>(`
		insert into "job" ("order_id", "api", "input", "raw_request", "status", "receive_at")
		values ($1, $2, $3, $4, $5, now())
		returning "id"
	`, [order_id, api, input, raw_request, 'pending'])
	assert(result.rows.length === 1)
	return result.rows[0].id
}

export
async function mark_job_as_sent(job_id: number) {
	const result = await db.queryObject(`
		update "job" set
			status='processing',
			send_at=now()
		where id=$1
	`, [job_id])
	assert(result.rowCount === 1)
}

export
async function mark_job_as_finished(job_id: number, output: string, raw_response: string) {
	const result = await db.queryObject(`
		update "job" set
			output=$2,
			raw_response=$3,
			status='finished',
			finish_at=now()
		where id=$1
	`, [job_id, output, raw_response])
	assert(result.rowCount === 1)
}

export
async function mark_job_as_failed(job_id: number, error: string, raw_response?: string) {
	const result = await db.queryObject(`
		update "job" set
			error=$2,
			raw_response=$3,
			status='failed',
			finish_at=now()
		where id=$1
	`, [job_id, error, raw_response])
	assert(result.rowCount === 1)
}

export
interface I_ali_vi__job {
	id: number
	order_id: string
	api: I_ali_vi__key

	input: string
	output?: string

	status: I_job_status
	error?: string
	raw_request: string
	raw_response?: string
	receive_at: Date
	send_at?: Date
	finish_at?: Date
}

export
async function get_job(job_id: number): Promise<I_ali_vi__job> {
	const result = await db.queryObject<I_ali_vi__job>(`
		select * from "job" where id=$1
	`, [job_id])
	assert(result.rows.length === 1)
	return result.rows[0]
}

