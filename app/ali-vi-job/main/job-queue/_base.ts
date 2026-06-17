import type { I_ali_vi__meta } from '@local/ali-vi-meta'
import { sleep, dont_throw_async } from '@ppz/ppz'
import * as db from '../db.ts'

export
interface I_rr {
	image: string
}

class Job_promise<RR extends I_rr> {
	promise: Promise<void>
	resolve!: () => void
	reject!: (e: unknown) => void
	constructor(
		public job_id: number,
		public order_id: string,
		public input: RR,
	) {
		this.job_id = job_id
		this.input = input
		this.promise = new Promise<void>((res, rej) => {
			this.resolve = res
			this.reject = rej
		})
	}
}

export
abstract class Job_queue<RR extends I_rr, RO> {
	protected readonly meta: I_ali_vi__meta
	private working = false
	private queue: Job_promise<RR>[] = []
	private job_id_to_promise: Map<number, Job_promise<RR>> = new Map()
	/** 多任务线性执行间隔 */
	private interval: number

	constructor(meta: I_ali_vi__meta) {
		this.meta = meta
		// this.interval = Math.ceil(1000 / meta.qps)
		this.interval = Math.ceil(1000 / 2)
	}

	/**
	 * 1. 由子类实现
	 * 2. 不考虑 throttle 等通用逻辑
	 */
	protected abstract exec(input: RR): Promise<{
		output: string
		raw_response: RO
	}>
	/**
	 * 1. 包装具体子类 exec
	 * 2. 附带 throttle、异常处理等通用逻辑
	 */
	private async safe_exec(job_promise: Job_promise<RR>): Promise<boolean> {
		const exec_result = await dont_throw_async(async () =>
			await this.exec(job_promise.input)
		)
		if (!exec_result.ok) { // 任务执行失败
			console.error('job exec error', job_promise.job_id)
			console.error(exec_result.error)
			if (exec_result.error instanceof Api_error)
				// 阿里云返回的异常
				await db.mark_job_as_failed(
					job_promise.job_id,
					'error from ali vi',
					JSON.stringify(exec_result.error.api_error),
				)
			else
				// 其他异常
				await db.mark_job_as_failed(
					job_promise.job_id,
					'unknown error on executing job',
				)
			job_promise.reject('(reject) job exec error')
			return false
		} else { // 任务执行成功
			const { output, raw_response } = exec_result.value
			await db.mark_job_as_finished(
				job_promise.job_id,
				output,
				JSON.stringify(raw_response), // 执行成功时，response 一定是 json
			)
			job_promise.resolve()
			return true
		}
	}

	async push(order_id: string, input: RR) {
		const job_id = await db.new_job(
			order_id,
			this.meta.key,
			input.image,
			JSON.stringify(input),
		)

		const result_promise = new Job_promise(job_id, order_id, input)
		this.queue.push(result_promise)
		this.job_id_to_promise.set(job_id, result_promise)
		this.start()

		const wait_number = this.queue.length // this.start 会自动减少一个
		const wait_time = this.interval * wait_number

		return { job_id, wait_time, wait_number }
	}

	get_promise(job_id: number) {
		const jp = this.job_id_to_promise.get(job_id)
		return jp === undefined ? Promise.resolve() : jp.promise
	}

	private async start() {
		if (this.working)
			return
		this.working = true

		while (true) {
			const job_promise = this.queue.shift() // 从 queue 中取出
			if (job_promise === undefined) {
				this.working = false
				return
			}

			const send_at = Date.now() // 任务实际开始时间
			let success // 当前任务是否执行成功
			try {
				console.log(`任务(id: ${job_promise.job_id})开始, 当前等待 ${this.queue.length}`)
				await db.mark_job_as_sent(job_promise.job_id)
				success = await this.safe_exec(job_promise)
			} catch (err) {
				console.error(err)
			}

			this.job_id_to_promise.delete(job_promise.job_id) // 从 map 中删除
			if (success) { // 如果任务成功了，就 throttle
				const finish_at = Date.now()
				const duration = finish_at - send_at
				if (duration < this.interval)
					await sleep(this.interval - duration)
			}
		}
	}
}

interface I_http_error {
	status: number
	body: string
}
/** 调用阿里云视觉智能平台 API 时有 Response 但 response.ok === false */
class Api_error extends Error {
	constructor(
		public readonly api_error: I_http_error
	) {
		super('error from ali vi api')
	}
}
