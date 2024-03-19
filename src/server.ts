import fastify from "fastify"
import { z } from "zod"
import { sql } from './lib/postgres'
import postgres from "postgres"

const app = fastify()

// GET, POST, PUT, DELETE, PATCH

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
 
    const link = await sql/*sql*/`
        SELECT id, original_url
        FROM urlshortener
        WHERE urlshortener.code = ${code}
    `

    if(!link[0]){
        return reply.status(404).send({ error: 'The short link does not exist' })
    }

    // 301 = Moved Permanently
    // 302 = Temporary Redirect
    
    return reply.redirect(301, link[0].original_url)
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

app.listen({
    port: 8000,
}).then(() => {
    console.log("Server is running on port 8000")
})