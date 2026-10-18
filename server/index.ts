import 'dotenv/config'
import express from 'express'
import { handleApi } from './api.js'

const app = express()
const port = Number(process.env.PORT ?? 8787)

app.use(async (req, res, next) => {
  if (await handleApi(req, res)) return
  next()
})

app.use(express.static('dist'))

app.listen(port, () => {
  console.log(`Basil API on http://localhost:${port}`)
})
