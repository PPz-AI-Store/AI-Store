# 用 docker compose 启动 Postgres 数据库

先 cd 到 `compose.yaml` 所在目录，然后：

> 在 linux 上，未加入 docker 组的用户需要“先加入 docker 组”或“使用 sudo”。

``` base
docker compose up -d
```

## docker compose 常用命令
**生产环境慎用！**

> compose 命令需在 compose.yaml 所在文件夹执行

##### 停止容器
``` bash
docker compose stop
```

或者在任何目录 `docker stop [container-name]`，如：

``` bash
docker stop ali-vi-job--db
# docker start ali-vi-job--db
```

##### 删除容器
删除容器、网络，保留 volume（数据）:
``` bash
docker compose down
```

删除容器、网络、volume:
``` bash
docker compose down -v
```

##### 查看当前容器
``` bash
docker ps -a # ps: process status
```

##### 查看当前 Volume
``` bash
docker volume ls
```
