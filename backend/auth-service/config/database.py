from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

engine = create_engine('mysql+pymysql://root:root@localhost:3306/vampire')
SessionLocal = sessionmaker(autoflush=False, bind=engine,autocommit=False)
conn = engine.connect()


