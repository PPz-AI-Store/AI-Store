import type { Signal } from '@preact/signals'

interface I_props {
	count: Signal<number>
}

export default function Counter(props: I_props) {
	return (
		<div>
			<button type='button' onClick={() => props.count.value -= 1}>-1</button>
			<p>{props.count}</p>
			<button type='button' onClick={() => props.count.value += 1}>+1</button>
		</div>
	)
}
