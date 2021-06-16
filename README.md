# AktVite

这是个人学习时编写的简易 vite，仅支持 `js`，`vue` 文件和包模块导入

## 开始

```shell
git clone git@github.com:akitaSummer/aktvite.git

cd aktvite

yarn install

yarn start
```

## 思路

### javascript

收到`js`文件请求后，会先通过正则匹配判断文件中的引入是否是包，如果是包，则替换前缀，再次接受请求后，根据包名从`node_modules`中对应的包文件的`package.json`的`module`字段,返回文件

### vue

`.vue`文件会分为两步，首先解析文件后，通过正则匹配分为 template，script 和 styple 三个部分。

第一步会将 script 部分返回，再其中将 template 和 style 插入

第二步会将 template 通过`'@vue/compiler-dom`解析
