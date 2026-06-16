# 使用 dbmate 管理 migration

+ [dbmate](https://github.com/amacneil/dbmate)
+ [PostgreSQL 18](https://www.postgresql.org/docs/18/index.html)

## dbmate

安装
``` bash
pnpm install -g dbmate
```

> 以下命令在 `db/migration` 所在目录执行，如 `app/ali-vi-job`

新 migration
``` bash
dbmate new migration-name
```

migrate up
``` bash
dbmate -u "connection-string" up # u: url
# dbmate -u "postgres://abcde:12345@127.0.0.1:5432/ali-vi-job?sslmode=disable" up
```
