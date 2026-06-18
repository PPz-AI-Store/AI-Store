import type { I_route, I_http_method, I_http_server_opts } from './type.ts'

function Router(route_list: I_route[]) {
	console.log(`\n\nroute list(${route_list.length}):`)
	for (const r of route_list)
		console.log(r.method, r.path)

	return (pathname: string, method: I_http_method) => {
		for (const route of route_list)
			if (route.path === pathname && route.method === method)
				return route.handler
		return null
	}
}

export
function http_server(opts: I_http_server_opts) {
	console.log('\n\n')
	const server_name = opts.name ? `[${opts.name}] ` : ''
	console.log(`${server_name}http server starting`)
	const router = Router(opts.route_list)
	Deno.serve(
		{ port: opts.port },
		async req => {
			try {
				const url = new URL(req.url)
				const handler = router(url.pathname, req.method as I_http_method)
				if (handler === null) {
					console.error('404:', req.url)
					return new Response('noT founD', { status: 404 })
				}
				return await handler(req, url)
			} catch (err) {
				if (err instanceof Response)
					return err

				console.error('未知的 http handler 异常')
				console.error(err)
				return new Response('unknowN erroR', { status: 500 })
			}
		}
	)
}