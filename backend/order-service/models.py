from enum import Enum

from sqlalchemy import Column, Integer, String, Float, Enum as SQLAlchemyEnum, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship

from config.db import Base


class BloodType(Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


class OrderStatus(Enum):
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    IS_SENT = "IS_SENT"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class Meal(Base):
    __tablename__ = 'meals'
    id = Column(Integer, primary_key=True,nullable=False)
    name = Column(String(60), nullable=False)
    price = Column(Float, nullable=False)
    blood_type = Column(SQLAlchemyEnum(BloodType), nullable=False)
    available = Column(Boolean, nullable=False)
    image_path = Column(String(60), nullable=False)
    cart_items = relationship("ShoppingCart", back_populates="meal")
    order_items = relationship("OrderItem", back_populates="meal")


class ShoppingCart(Base):
    __tablename__ = 'shopping_cart'
    id = Column(Integer, primary_key=True,nullable=False)
    user_id = Column(Integer, nullable=False)
    meal_id = Column(Integer, ForeignKey('meals.id'), nullable=False)
    amount = Column(Integer, nullable=False, default=1)
    meal = relationship("Meal", back_populates="cart_items")


class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True,nullable=False)
    user_id = Column(Integer, nullable=False)
    full_price = Column(Float, nullable=False)
    address = Column(String(100), nullable=False)
    order_date = Column(TIMESTAMP, nullable=False)
    status = Column(SQLAlchemyEnum(OrderStatus), nullable=False)

    order_items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = 'order_items'
    id = Column(Integer, primary_key=True,nullable=False)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    meal_id = Column(Integer, ForeignKey('meals.id'), nullable=False)
    amount = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="order_items")
    meal = relationship("Meal", back_populates="order_items")