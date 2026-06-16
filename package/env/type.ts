export
interface I_app_env {
	aliyun: {
		ak: {
			id: string
			secret: string
		}
		tmp_oss_bucket: string
		region: string
	}
	server: {
		ali_vi_job: {
			port: number
		}
	}
	database: {
		ali_vi_job: {
			url: string
		}
	}
}
