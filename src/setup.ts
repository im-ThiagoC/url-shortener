import { sql } from "./lib/postgres";

async function setup() {
    await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS urlshortener(
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `

    await sql.end()

    console.log('Setup executado com sucesso!')
}

setup()