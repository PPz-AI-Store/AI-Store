import { useSignal } from '@preact/signals'
import { Head } from 'fresh/runtime'
import { define } from '#/g/server.ts'
import Counter from '#/islands/counter.tsx'

export default
define.page(function() {
	const count = useSignal(3)
	return <>
		<Head>
			<title>抠图 - AI 商店</title>
		</Head>
		<div>
			<Counter count={count} />
		</div>
	</>
})
