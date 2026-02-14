#!/bin/bash

cd `dirname $0`                             #将当前工作目录更改为脚本所在的目录
proj_home=$PWD                              # the project root dir

echo "接取镜像"
git pull --force

echo "安装依赖"
pnpm install --registry=https://registry.npmmirror.com/

echo "编译开始"
pnpm run build
echo "编译完成"


rm -rf /etc/nginx/html/hylir-dash-board/*

cp -r -f $PWD/dist/* /etc/nginx/html/hylir-dash-board/


echo "完成ENDENDEND"







