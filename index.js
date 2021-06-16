const Koa = require('koa')
const fs = require('fs')
const path = require('path')
const complierDOM = require('@vue/compiler-dom')

const app = new Koa()

// 模块地址重写
// import xx from 'vue -> import xx from '/@modules/vue'
const rewriteImport = (content) => {
    return content.replace(/ from ['"](.*)['"]/g, (s1, s2) => {
        if (s2.startsWith('/') || s2.startsWith('./') || s2.startsWith('../')) {
            return s1
        } else {
            // 包
            return ` from '/@modules/${s2}'`
        }
    })
}

app.use(async ctx => {
    const { url, query } = ctx.request
    if (url === '/') {
        // 根路径加载html
        ctx.type = 'text/html'
            // /@vue/shared 中有process, 需要hack
        ctx.body = fs.readFileSync('./src/index.html', 'utf-8').replace(/\<\/head\>/, `<script type="text/javascript">window.process = { env: { NODE_ENV: 'dev' } }</script><\/head>`)
    } else if (url.endsWith('.js')) {
        // .js后缀文件加载处理
        const jsFilepath = path.join(__dirname, url)
        ctx.type = 'text/javascript'
        const jsFile = fs.readFileSync(jsFilepath, 'utf-8')
        ctx.body = rewriteImport(jsFile)
    } else if (url.startsWith('/@modules/')) {
        // 处理包的加载
        const modulesName = url.replace('/@modules/', "")
        const prefix = path.join(__dirname, './node_modules', modulesName)
            // 从package.json中获取module字段
        const module = require(path.join(prefix, 'package.json')).module
        const filePath = path.join(prefix, module);
        const modulesFile = fs.readFileSync(filePath, 'utf-8')
        ctx.type = 'text/javascript'
        ctx.body = rewriteImport(modulesFile)
    } else if (url.indexOf('.vue') > -1) {
        // 读取vue文件, 如果解析后，会带有?type-template用于获取模板
        const vueFilePath = path.join(__dirname, url.split("?")[0])
        fs.readFileSync(vueFilePath, 'utf-8')
            // 获取脚步部分内容
        const vueFile = fs.readFileSync(vueFilePath, 'utf-8')
        if (!query.type) {
            const result = vueFile.match(/(?=script.*?)[\s\S]*(?=\/script)/)[0]
            const vueScriptContent = result.slice(7, result.length - 1)
                // 替换默认导出为一个常量，方便后续修改
            const script = vueScriptContent.replace('export default ', 'const __script = ')
                // 解析style
            const vueStyleContent = vueFile.match(/(?=style.*?)[\s\S]*(?=\/style)/)[0]
            const vueStyleScript = vueStyleContent.slice(6, result.length - 1)
            ctx.type = 'text/javascript'
            ctx.body = `
                ${rewriteImport(script)}
                // 解析tpl
                import { render as __render } from '${url}?type=template'
                document.head.innerHTML += \`<style type="text/css">${vueStyleScript}</style>\`
                __script.render = __render
                export default __script
            `
        } else if (query.type === 'template') {
            // 解析template
            const result = vueFile.match(/(?=template.*?)[\s\S]*(?=\/template)/)[0]
            const vueTemplateContent = result.slice(9, result.length - 1)
            const render = complierDOM.compile(vueTemplateContent, { mode: 'module' }).code
            ctx.type = 'text/javascript'
            ctx.body = rewriteImport(render)
        }
    }

})

app.listen(3000, () => {
    console.log('AktVite start in http://localhost:3000')
})