import os
import shutil
from datetime import datetime, time
from venv import logger
from sqlalchemy.orm import joinedload
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from pydantic import BaseModel
from typing import Annotated, Any, List

from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.staticfiles import StaticFiles

import models
from config.db import engine, SessionLocal
from sqlalchemy.orm import Session

app = FastAPI()
UPLOAD_DIRECTORY = "uploads/images"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
models.Base.metadata.create_all(bind=engine)
app.mount("/uploads/images", StaticFiles(directory="uploads/images"), name="images")
origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Список доменів, з яких дозволені запити
    allow_credentials=True,
    allow_methods=["*"],  # Дозволяє всі HTTP методи
    allow_headers=["*"],
)

HOLIDAYS = [
    "2024-01-07",  # Різдво
    "2024-04-28",  # Пасха
    "2024-05-01",  # День праці
    # Додайте інші свята...
]

def is_holiday(date):
    return date.strftime("%Y-%m-%d") in HOLIDAYS

def is_daytime():
    now = datetime.now().time()
    # Заборонити замовлення з 8:00 до 18:00
    return time(8, 0) <= now <= time(18, 0)

class MealBase(BaseModel):
    name: str
    price: float
    blood_type: models.BloodType
    available: bool
    image_path: str


class MealPut(BaseModel):
    name: str
    price: float
    blood_type: models.BloodType
    available: bool


class ShoppingCartBase(BaseModel):
    user_id: int
    meal_id: int
    amount: int


class OrderItemBase(BaseModel):
    meal_id: int
    amount: int


class OrderBase(BaseModel):
    user_id: int
    full_price: float
    address: str
    order_date: datetime
    status: models.OrderStatus = "ACCEPTED"
    items: List[OrderItemBase]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file:
        return JSONResponse(content={"error": "No file uploaded"}, status_code=400)

    file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": file_location}


@app.post("/meals", status_code=status.HTTP_201_CREATED)
async def create_meal(meal: MealBase, db: db_dependency):
    try:
        db_meal = models.Meal(**meal.dict())
        db.add(db_meal)
        db.commit()
    except Exception as e:
        logger.error(f"Error while adding meal: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An error occurred while adding the meal.")


@app.get("/meals", status_code=status.HTTP_200_OK)
async def get_meals(db: db_dependency):
    try:
        db_meals = db.query(models.Meal).all()
        return db_meals
    except Exception as e:
        logger.error(f"Error while getting meals: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while getting meals.")


@app.get("/meals/{meal_id}", status_code=status.HTTP_200_OK)
async def get_meal(meal_id: int, db: db_dependency):
    try:
        db_meal = db.query(models.Meal).filter(models.Meal.id == meal_id).first()
        if db_meal is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal does not exist.")
        return db_meal
    except Exception as e:
        logger.error(f"Error while getting meal: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while getting the meal.")


@app.put("/meals/{meal_id}", status_code=status.HTTP_200_OK)
async def edit_meal(meal_id: int, meal: MealPut, db: db_dependency):
    try:
        db_meal = db.query(models.Meal).filter(models.Meal.id == meal_id).first()
        if db_meal is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal does not exist.")
        db_meal.name = meal.name
        db_meal.price = meal.price
        db_meal.blood_type = meal.blood_type
        db_meal.available = meal.available

        db.commit()

        db.refresh(db_meal)
        return db_meal
    except Exception as e:
        logger.error(f"Error while editing meal: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while editing meal.")


@app.delete("/meals/{meal_id}", status_code=status.HTTP_200_OK)
async def delete_meal(meal_id: int, db: db_dependency):
    try:
        db_meal = db.query(models.Meal).filter(models.Meal.id == meal_id).first()
        if db_meal is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal does not exist.")
        db.delete(db_meal)
        db.commit()
    except Exception as e:
        logger.error(f"Error while deleting meal: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while deleting meal.")




@app.get("/shopping_cart/{user_id}", status_code=status.HTTP_200_OK)
async def get_shopping_cart(user_id: int, db: db_dependency):
    try:
        # Використання joinedload для завантаження зв'язаних даних з таблиці Meal
        shopping_cart = (
            db.query(models.ShoppingCart)
            .options(joinedload(models.ShoppingCart.meal))  # Завантаження даних з Meal
            .filter(models.ShoppingCart.user_id == user_id)
            .all()
        )
        return shopping_cart
    except Exception as e:
        logger.error(f"Error while getting shopping cart: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting shopping cart."
        )


@app.post("/shopping_cart", status_code=status.HTTP_201_CREATED)
async def create_shopping_cart_item(shopping_cart: ShoppingCartBase, db: db_dependency):
    try:
        db_shopping_cart = models.ShoppingCart(**shopping_cart.dict())
        db.add(db_shopping_cart)
        db.commit()
    except Exception as e:
        logger.error(f"Error while adding shopping cart: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while adding item to shopping cart.")


@app.put("/shopping_cart/{shopping_cart_id}", status_code=status.HTTP_200_OK)
async def edit_shopping_cart_item(shopping_cart_id: int, shopping_cart: ShoppingCartBase, db: db_dependency):
    try:
        db_shopping_cart = db.query(models.ShoppingCart).filter(models.ShoppingCart.id==shopping_cart_id).first()
        if db_shopping_cart is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Shopping cart does not exist.")
        db_shopping_cart.user_id = shopping_cart.user_id
        db_shopping_cart.full_price = shopping_cart.full_price
        db_shopping_cart.meal_id = shopping_cart.meal_id
        db_shopping_cart.amount = shopping_cart.amount
        db.commit()
        db.refresh(db_shopping_cart)
        return db_shopping_cart
    except Exception as e:
        logger.error(f"Error while editing shopping cart: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while editing shopping cart item.")


@app.delete("/shopping_cart/{shopping_cart_id}", status_code=status.HTTP_200_OK)
async def delete_shopping_cart_item(shopping_cart_id: int, db: db_dependency):
    db_shopping_cart = db.query(models.ShoppingCart).filter(models.ShoppingCart.id==shopping_cart_id).first()
    if db_shopping_cart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping cart does not exist.")
    db.delete(db_shopping_cart)
    db.commit()

@app.get("/orders", status_code=status.HTTP_200_OK)
async def get_all_orders( db: db_dependency):
    try:
        # Виконуємо JOIN для отримання замовлень разом з товарами
        orders = (
            db.query(models.Order)
            .join(models.Order.order_items)  # Передбачаємо, що у вас є зв'язок у моделях
            .all()
        )

        # Формуємо список замовлень з пов'язаними товарами
        result = []
        for order in orders:
            order_data = {
                "order_id": order.id,
                "user_id": order.user_id,
                "full_price": order.full_price,
                "address": order.address,
                "order_date": order.order_date,
                "status": order.status,
                "items": [{"meal_id": item.meal_id, "amount": item.amount} for item in order.order_items]
                # або ваший метод для отримання товарів
            }
            result.append(order_data)

        return result
    except Exception as e:
        logger.error(f"Error while getting orders: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An error occurred while getting orders")

@app.get("/orders/{user_id}", status_code=status.HTTP_200_OK)
async def get_orders(user_id: int, db: db_dependency):
    try:
        # Виконуємо JOIN для отримання замовлень разом з товарами
        orders = (
            db.query(models.Order)
            .join(models.Order.order_items)  # Передбачаємо, що у вас є зв'язок у моделях
            .filter(models.Order.user_id == user_id)
            .all()
        )

        # Формуємо список замовлень з пов'язаними товарами
        result = []
        for order in orders:
            order_data = {
                "id": order.id,
                "full_price": order.full_price,
                "address": order.address,
                "order_date": order.order_date,
                "status": order.status,
                "items": [{"meal_id": item.meal_id, "amount": item.amount} for item in order.order_items]
                # або ваший метод для отримання товарів
            }
            result.append(order_data)

        return result
    except Exception as e:
        logger.error(f"Error while getting orders: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An error occurred while getting orders")


@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(order: OrderBase, db: db_dependency):
    # Отримуємо поточну дату
    now = datetime.now()

    # Перевіряємо на свята та час доби
    if is_holiday(now) or is_daytime():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Оформлення замовлень заборонено вдень або у церковні свята."
        )

    try:
        order_data = order.dict(exclude={"items"})
        db_order = models.Order(**order_data)
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        for item in order.items:
            db_order_item = models.OrderItem(
                order_id=db_order.id,
                meal_id=item.meal_id,
                amount=item.amount
            )
            db.add(db_order_item)
        db.commit()
        return db_order
    except Exception as e:
        logger.error(f"Error while adding order: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while adding order.")


@app.put("/orders/{order_id}", status_code=status.HTTP_200_OK)
async def edit_order(order_id: int, order: OrderBase, db: db_dependency):
    try:
        db_order = db.query(models.Order).filter(models.Order.id == order_id).first()

        if db_order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order does not exist.")

        # Оновлюємо атрибути замовлення
        db_order.user_id = order.user_id
        db_order.full_price = order.full_price
        db_order.address = order.address
        db_order.order_date = order.order_date
        db_order.status = order.status

        # Оновлюємо елементи замовлення
        current_order_items = db_order.order_items

        # Видаляємо старі елементи (за потреби)
        for item in current_order_items:
            db.delete(item)

        # Додаємо нові елементи замовлення
        for item_data in order.items:
            new_item = models.OrderItem(**item_data.dict())  # Створюємо новий OrderItem
            db_order.order_items.append(new_item)  # Додаємо до order_items

        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        logger.error(f"Error while editing order: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An error occurred while editing order.")


@app.delete("/orders/{order_id}", status_code=status.HTTP_200_OK)
async def delete_order(order_id: int, db: db_dependency):
    try:
        db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
        if db_order is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order does not exist.")
        db.delete(db_order)
        db.commit()
    except Exception as e:
        logger.error(f"Error while deleting order: {e}")
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail= "An error occurred while deleting order.")

