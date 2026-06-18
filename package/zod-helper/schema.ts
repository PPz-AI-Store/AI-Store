import z from '@zod/zod'
import { tmp_oss_hostname } from '@local/ali-oss-helper'

export
const user_uploaded_img = z.url({
	protocol: /^https$/, // 默认忽略大小写
	hostname: new RegExp('^' + tmp_oss_hostname + '$'),
})
