# 数据库备份

## 备份

``` bash
pg_dump \
  -Fc \
  -h localhost \
  -U username \
  -d dbname \
  -f backup.dump
```

替换其中 username 和 dbname，最终得到 backup.dump。

## 恢复

``` bash
pg_restore \
  -h localhost \
  -U username \
  -d dbname \
  backup.dump
```
