import { app_env } from '@local/env'
import { http_server } from '@local/http-server'

http_server({
	name: 'ali vi job',
	port: app_env.server.ali_vi_job.port,
	route_list: [
	],
})
