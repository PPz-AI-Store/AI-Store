import { Config } from '@alicloud/openapi-client'
import { app_env } from '@local/env'

export
function get_client_config(endpoint: string) {
	const config = new Config({
		accessKeyId: app_env.aliyun.ak.id,
		accessKeySecret: app_env.aliyun.ak.secret,
	})
	config.endpoint = endpoint
	return config
}
