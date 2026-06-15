# 阿里云视觉智能平台 API 封装

+ [计费](https://help.aliyun.com/zh/viapi/product-overview/billing-way)
+ [API 文档](https://help.aliyun.com/zh/viapi/developer-reference/api-overview)

阿里云视觉智能平台的接口有频率限制。
此 app 对阿里云视觉智能平台的接口做一层封装，使调用者不需考虑频率限制。

### 流程

为保证系统的简单，当前流程不支持“重启后自动开始未完成的任务”。

##### 创建任务
+ 收到请求
+ create job
+ insert into database
+ push job queue
+ respond: job id, 等待时间

##### 获取结果
+ 收到请求 (job_id)
+ 从 job queue 里获得 Promise
+ Promise 为 null？
	+ null: job 已结束（但未必成功），直接从数据库里读
	+ 非 null: job 未完成，先 wait promise，再从数据库里读
+ respond: result_url

> 未成功的任务，不产生费用，不予重启，提示用户重新提交 job。

##### 查看当前未完成的任务 （内部）
+ respond: orders unfinished

##### 停止新请求（内部）
> 预备关机

+ respond: ok
