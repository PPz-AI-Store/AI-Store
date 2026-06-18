import { App, staticFiles } from 'fresh'

export const app = new App()

app.use(staticFiles())

app.use(ctx => {
	console.log(`${ctx.req.method} ${ctx.req.url}`)
	return ctx.next()
})

app.fsRoutes()
