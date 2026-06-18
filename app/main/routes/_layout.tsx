import { define } from '#/g/server.ts'

export default
define.layout(({ Component, url }) => {
	return (
		<div class=''>
			<nav class='flex gap-4'>
				<a href='/'>Home</a>
				<a href='/m/segment'>segment</a>
			</nav>
			<main>
				<Component />
			</main>
			<footer>&copy; 2026</footer>
		</div>
	)
})
