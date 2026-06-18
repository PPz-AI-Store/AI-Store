import OSS from 'ali-oss'
import { app_env } from '@local/env'

export
async function sign_oss_upload(file_name: string, content_type: string) {
	const client = await new OSS({
		accessKeyId: app_env.aliyun.ak.id,
		accessKeySecret: app_env.aliyun.ak.secret,
		bucket: app_env.aliyun.tmp_oss_bucket,
		region: 'oss-' + app_env.aliyun.region,
		authorizationV4: true,
		secure: true,
	})

	return await client.signatureUrlV4(
		'PUT',
		60 * 10, // 10 minutes
		{
			headers: {
				'Content-Type': content_type,
			},
		},
		file_name,
	)
}
