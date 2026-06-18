import { app_env } from '@local/env'

export * from './signer.ts'

export
const tmp_oss_hostname
	= app_env.aliyun.tmp_oss_bucket
	+ '.oss-'
	+ app_env.aliyun.region
	+ '.aliyuncs.com'
