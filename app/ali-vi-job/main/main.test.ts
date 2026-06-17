import { Segment_body } from './job-queue/segment-body.ts'
import { get_job } from './db.ts'

const target = new Segment_body()
const go = async () =>
	await target.push(crypto.randomUUID(), {
		form: 'abc',
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
		await target.get_promise(job_id)
		const job_result = await get_job(job_id)
		console.log(`index: ${i}, output: ${job_result.output}`)
	})
}
