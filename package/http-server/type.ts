export
type I_http_method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export
interface I_route {
	path: string
	method: I_http_method
	handler: (req: Request, url: URL) => Promise<Response> | Response
}

export
interface I_http_server_opts {
	name?: string
	port: number
	route_list: I_route[]
}
