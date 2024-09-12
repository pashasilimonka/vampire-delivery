from datetime import  timedelta, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status

from config.database import SessionLocal
from models.user import User, CreateUserRequest, LoginRequest
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

SECRET_KEY = "1837he17388hdy183884js1342hd13df1334678"

ALGORITHM = "HS256"

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/auth/token")


class CreateUserContext(BaseModel):
    username: str
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


@router.post("/register", status_code=status.HTTP_200_OK)
async def create_user(db: db_dependency,
                      create_user_request: CreateUserRequest):
    existing_user = db.query(User).filter(User.username == create_user_request.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Username already exists")

    create_user_model = User(
        username=create_user_request.username,
        email=create_user_request.email,
        hash_password=bcrypt_context.hash(create_user_request.password),
        role=create_user_request.role
    )

    db.add(create_user_model)
    db.commit()

    token = create_access_token(
        username=create_user_model.username,
        id=create_user_model.id,
        role=create_user_model.role,
        expires_delta=timedelta(minutes=60)
    )


    return {"access_token": token, "token_type": "bearer"}


def create_access_token(username, id, role, expires_delta):
    encode = {'sub': username, "id": id, "role": role}
    expires = datetime.utcnow() + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: LoginRequest,
                                 db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token(
        username=user.username,
        id=user.id,
        role=user.role,
        expires_delta=timedelta(minutes=60)
    )

    return {'access_token': token, 'token_type': 'bearer'}


def authenticate_user(username: str, password: str, db: db_dependency):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hash_password):
        return False
    return user

async def get_current_user (token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Incorrect username or password")
        return {"username": username, "id": user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Could not validate credentials")
