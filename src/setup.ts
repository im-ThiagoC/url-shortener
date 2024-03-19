import { sql } from "./lib/postgres";

async function setup() {
    await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS urlshortener(
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
    )
    `
}

setup()