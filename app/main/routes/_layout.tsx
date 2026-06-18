import { define } from '#/g/server.ts'

export default
define.layout(({ Component, url }) => {
	return (
		<div>
			<nav>
				<a href='/'>Home</a>
				<a href='/pro/segment'>segment</a>
			</nav>
			<main>
				<Component />
			</main>
			<footer>&copy; 2026</footer>
		</div>
	)
})
