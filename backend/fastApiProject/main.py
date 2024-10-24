import logging
from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File
import httpx
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse

AUTH_SERVICE_URL = 'http://localhost:8001'
ORDER_SERVICE_URL = 'http://localhost:8002'
client = httpx.AsyncClient()  # Створюємо один екземпляр клієнта на рівні модуля
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/auth/login")



class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class MealBase(BaseModel):
    name: str
    price: float
    blood_type: str
    available: bool
    image_path: str = None


class MealPut(BaseModel):
    name: str
    price: float
    blood_type: str
    available: bool


class ShoppingCartBase(BaseModel):
    user_id: int
    meal_id: int
    amount: int


class OrderItemBase(BaseModel):
    order_id: int
    meal_id: int
    amount: int


class OrderBase(BaseModel):
    user_id: int
    full_price: float
    address: str
    order_date: datetime
    status: str
    items: List[OrderItemBase]
async def get_token(request: Request):
    body = await request.json()
    response = await client.post(f"{AUTH_SERVICE_URL}/auth/token", json=body)
    response.raise_for_status()
    return response.json()

async def verify_token(token: str):
    response = await client.post(f"{AUTH_SERVICE_URL}/auth/verify-token", json={"token": token})
    response.raise_for_status()
    return response.json()

app = FastAPI()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Список доменів, з яких дозволені запити
    allow_credentials=True,
    allow_methods=["*"],  # Дозволяє всі HTTP методи
    allow_headers=["*"],
)# Дозволяє всі заголовки

@app.post("/auth/login", response_model=Token)
async def login(request: Request):
    return await get_token(request)

@app.post("/auth/register", response_model=Token)
async def register(request: Request):
    return await get_token(request)


async def forward_request(url: str, token: str, method: str = "GET", json_data: dict = None):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, json=json_data, headers=headers)
        elif method == "PUT":
            response = await client.put(url, json=json_data, headers=headers)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)


@app.get("/{image_path:path}")
async def get_image(image_path: str):
    image_url = f"{ORDER_SERVICE_URL}/{image_path}"
    response = await client.get(image_url)

    if response.status_code == 200:
        # Створюємо StreamingResponse для байтів контенту зображення
        return StreamingResponse(
            content=response.iter_bytes(),
            media_type=response.headers['content-type']
        )
    else:
        raise HTTPException(status_code=404, detail="Image not found")


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        # Відправка запиту на інший сервіс
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ORDER_SERVICE_URL}/upload",
                files={"file": (file.filename, file.file, file.content_type)}
            )

        # Перевірка статусу відповіді
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error uploading file to the service")
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)



@app.get("/meals/")
async def get_meals(token: str = Depends(oauth2_bearer)):
    meals_url = f"{ORDER_SERVICE_URL}/meals/"
    return await forward_request(meals_url, token)

# Приклад ендпоїнта для створення страви
@app.post("/meals")
async def create_meal(meal_data: dict, token: str = Depends(oauth2_bearer)):
    meals_url = f"{ORDER_SERVICE_URL}/meals"
    return await forward_request(meals_url, method="POST", json_data=meal_data, token=token)

# Приклад ендпоїнта для отримання інформації про конкретну страву
@app.get("/meals/{meal_id}")
async def get_meal(meal_id: int, token: str = Depends(oauth2_bearer)):
    meal_url = f"{ORDER_SERVICE_URL}/meals/{meal_id}"
    return await forward_request(meal_url, token)

# Ендпоїнт для редагування страви
@app.put("/meals/{meal_id}")
async def edit_meal(meal_id: int, meal_data: dict, token: str = Depends(oauth2_bearer)):
    meal_url = f"{ORDER_SERVICE_URL}/meals/{meal_id}"
    return await forward_request(meal_url, method="PUT", json_data=meal_data, token=token)

# Ендпоїнт для видалення страви
@app.delete("/meals/{meal_id}")
async def delete_meal(meal_id: int, token: str = Depends(oauth2_bearer)):
    meal_url = f"{ORDER_SERVICE_URL}/meals/{meal_id}"
    return await forward_request(meal_url, method="DELETE", token=token)

@app.get("/shopping_cart/{user_id}", status_code=status.HTTP_200_OK)
async def get_shopping_cart(user_id: int, token: str = Depends(oauth2_bearer)):
    try:
        shopping_cart_url = f"{ORDER_SERVICE_URL}/shopping_cart/{user_id}"
        response = await forward_request(shopping_cart_url, method="GET", token=token)
        logger.info(f"Response from shopping cart service: {response}")  # Логування відповіді
        return response
    except Exception as e:
        logger.error(f"Error in get_shopping_cart: {e}")  # Логування помилки
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/shopping_cart", status_code=status.HTTP_201_CREATED)
async def create_shopping_cart(shopping_cart: dict, token: str = Depends(oauth2_bearer)):
    shopping_cart_url = f"{ORDER_SERVICE_URL}/shopping_cart"
    return await forward_request(shopping_cart_url, method="POST", json_data=shopping_cart, token=token)


@app.put("/shopping_cart/{shopping_cart_id}", status_code=status.HTTP_200_OK)
async def edit_shopping_cart(shopping_cart: dict, shopping_cart_id: int):
    shopping_cart_url = f"{ORDER_SERVICE_URL}/shopping_cart/{shopping_cart_id}"
    return await forward_request(shopping_cart_url, method="PUT", json_data=shopping_cart)


@app.delete("/shopping_cart/{shopping_cart_id}")
async def delete_shopping_cart(shopping_cart_id: int, token: str = Depends(oauth2_bearer)):
    shopping_cart_url = f"{ORDER_SERVICE_URL}/shopping_cart/{shopping_cart_id}"
    return await forward_request(shopping_cart_url, method="DELETE",token=token)


@app.get("/orders/{user_id}", status_code=status.HTTP_200_OK)
async def get_orders(user_id: int, token: str = Depends(oauth2_bearer)):
    orders_url = f"{ORDER_SERVICE_URL}/orders/{user_id}"
    return await forward_request(orders_url, token=token)

@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(token: str = Depends(oauth2_bearer)):
    orders_url = f"{ORDER_SERVICE_URL}/orders"
    return await forward_request(orders_url, method="GET", token=token)

@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(order_data: dict, token: str = Depends(oauth2_bearer)):
    orders_url = f"{ORDER_SERVICE_URL}/orders"
    return await forward_request(orders_url, method="POST", json_data=order_data, token=token)


@app.put("/orders/{order_id}", status_code=status.HTTP_200_OK)
async def edit_order(order_id: int, order_data: dict, token: str = Depends(oauth2_bearer)):
    order_url = f"{ORDER_SERVICE_URL}/orders/{order_id}"
    return await forward_request(order_url, method="PUT", json_data=order_data, token=token)


@app.delete("/orders/{order_id}")
async def delete_order(order_id: int):
    order_url = f"{ORDER_SERVICE_URL}/orders/{order_id}"
    return await forward_request(order_url, method="DELETE")




