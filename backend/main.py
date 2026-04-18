from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

DATABASE = 'data/data.json'

class Product(BaseModel):
    name: str
    weight: float = None
    price: float = None
    description: str = None

# Websocket connection manager
class WebsocketManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    async def send_message(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
websocket_manager = WebsocketManager()

# Websocket route for real-time updates of new products
@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        websocket_manager.disconnect(websocket)
    
# Standard route
@app.get('/')
async def root():
    return {'status': 'ok'}

# Route to list all products
@app.get('/products/')
async def get_products():
    return read_db()

# Route to retrieve info about a specific product
@app.get('/products/{product_id}')
async def get_product(product_id: int):
    products = read_db()
    if product_id < 0 or product_id >= len(products):
        return HTTPException(status_code=404, detail='Product not found')
    return {'product': products[product_id]}

# Route to create a product
@app.post('/products/')
async def create_product(product: Product):
    db = read_db()
    db.append(product.model_dump())
    write_db(db)
    # send message to all websockets clients connected
    await websocket_manager.send_message(json.dumps(db))

    return {'result': product}

def read_db():
    try:
        with open(DATABASE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def write_db(data):
    with open(DATABASE, 'w') as file:
        json.dump(data, file, indent=2)
