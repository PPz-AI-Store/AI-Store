import type { I_app_env } from './type.ts'

export type { I_app_env }

export
const app_env: I_app_env = {
	aliyun: {
		ak: {
			id: '',
			secret: '',
		},
		tmp_oss_bucket: '',
		region: 'cn-shanghai',
	},
	server: {
		ali_vi_job: {
			port: 11001,
		}
	},
	database: {
		ali_vi_job: {
			url: 'postgres://abcde:12345@127.0.0.1:5432/ali-vi-job?sslmode=disable',
		},
	},
}
