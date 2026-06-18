import { segment_body_queue } from './job-queue/segment/body.ts'
import { get_job } from './db.ts'

const go = async () =>
	await segment_body_queue.push(crypto.randomUUID(), {
		form: 'normal',
		image: '',
	})

const jobs = [
	go(),
	go(),
	go(),
	go(),
	go(),
]

for (let i=0; i<5; i++) {
	const job = jobs[i]
	job.then(async ({ job_id }) => {
		await segment_body_queue.get_promise(job_id)
		const job_result = await get_job(job_id)
		console.log(`index: ${i}, output: ${job_result.output}`)
	})
}
