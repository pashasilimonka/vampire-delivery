from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True)  # Вказано максимальну довжину 100 символів
    email = Column(String(100), unique=True)  # Також вказано довжину для email
    hash_password = Column(String(255))  # Вказано довжину для пароля
    role = Column(String(50))


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "USER"


class LoginRequest(BaseModel):
    username: str
    password: str
