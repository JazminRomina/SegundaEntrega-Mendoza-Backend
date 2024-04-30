import express from 'express'
import productsRouter from "./routes/products.router.js"
import cartsRouter from './routes/carts.router.js'
import viewsRouter from './routes/views.router.js'
import exphbs from 'express-handlebars'
import './database.js'
import { Server } from "socket.io"
import { ProductManager } from './controllers/ProductManager.js'
import MessageModel from './models/message.model.js'

const app = express()
const productManager = new ProductManager()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("./src/public"))

app.engine("handlebars", exphbs.engine())
app.set("view engine", "handlebars")
app.set("views", "./src/views")

const PORT = 8080

app.use('/api/products', productsRouter)
app.use('/api/carts',  cartsRouter)
app.use('/',  viewsRouter)

const httpServer = app.listen(PORT, () => {
    console.log(`Leyendo el puerto http://localhost:${PORT}`)
})
const io = new Server(httpServer)


io.on("connection", (socket) => {
    socket.on("mensaje", (data) => {
        console.log(data)
    })
    socket.on('prod', async(data) => {
        await productManager.addProducts(data)
    })
    socket.on('deleteProd', async(data) => {
        const productToDelete = await productManager.findProductByCode(data)
        await productManager.deleteProduct(productToDelete._id)
        socket.emit("prodsJson", 'http://localhost:8080/api/products')
    })
    socket.emit("prodsJson", 'http://localhost:8080/api/products')

    socket.on("message", async data => {
        await MessageModel.create(data)
        const messageData = await MessageModel.find()
        io.sockets.emit("message", messageData)
    })
})
