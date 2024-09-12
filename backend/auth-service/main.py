from typing import Annotated

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from config import auth
from config.auth import get_current_user
from config.database import SessionLocal

app = FastAPI()
app.include_router(auth.router)

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Список доменів, з яких дозволені запити
    allow_credentials=True,
    allow_methods=["*"],  # Дозволяє всі HTTP методи
    allow_headers=["*"],  # Дозволяє всі заголовки
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


@app.get("/")
async def root(user: user_dependency, db: db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail="Auth failed")
    return {"User": user}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
