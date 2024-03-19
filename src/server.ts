import fastify from "fastify"
import { z } from "zod"
import { sql } from './lib/postgres'
import postgres from "postgres"
import { redis } from "./lib/redis"

const app = fastify()

// GET, POST, PUT, DELETE, PATCH

app.get('/', async () => {
    return { hello: 'world' }
})

app.get('/api/links', async () => {
    const result = await sql/*sql*/`
        SELECT *
        FROM urlshortener
        ORDER BY created_at DESC
    `

    return result
})

app.get('/:code', async (request, reply) => {

    const getLinkSchema = z.object({
        code: z.string().min(3),
    })

    const { code } = getLinkSchema.parse(request.params)
 
    const result = await sql/*sql*/`
        SELECT id, original_url
        FROM urlshortener
        WHERE urlshortener.code = ${code}
    `

    if(!result[0]){
        return reply.status(404).send({ error: 'The short link does not exist' })
    }

    // 301 = Moved Permanently
    // 302 = Temporary Redirect

    const link = result[0]

    await redis.zIncrBy('analytics', 1, String(link.id))

    return reply.redirect(301, link.original_url)
})

app.post('/api/links', async (request, reply) => {

    const createLinkSchema = z.object({
        code: z.string().min(3),
        url: z.string().url(),
    })


    const { code, url } = createLinkSchema.parse(request.body)
    

    try{
        const result = await sql/*sql*/`
        INSERT INTO urlshortener (code, original_url)
        VALUES (${code}, ${url})
        RETURNING id
    `

        const link = result[0]

        return reply.status(201).send({ urlShortenerId: link.id })

    }
    catch(err){
        if(err instanceof postgres.PostgresError && err.code === '23505'){
            return reply.status(400).send({ error: 'The short link already exists' })
        }

        console.error(err)

        return reply.status(500).send({ error: 'Something went wrong' })
    }
})

app.get('/api/analytics', async () => {
    const result = await redis.zRangeByScoreWithScores('analytics', 0, 50)

    const sqlResult = await sql/*sql*/`
        SELECT *
        FROM urlshortener
    `    

    return result
    .sort((a, b) => b.score - a.score)
    .map(item => {
        return {
            code: sqlResult.find(link => link.id === Number(item.value))?.code,
            urlShortenerId: item.value,
            clicks: item.score,
        }
    })
})

app.listen({
    port: 8000,
}).then(() => {
    console.log("Server is running on port 8000")
})


