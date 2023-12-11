from datetime import datetime, timedelta
from typing import Union

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select

from sqlalchemy.orm import Session

from app.database import models
from app.models.user_auth import request_model

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def get_user(session: Session, email: str=None,user_id:str=None) -> request_model.UserInDB:
    stmt = select(models.User)
    if email is not None:
        stmt = stmt.where(models.User.email == email)
    else:
        stmt = stmt.where(models.User.user_id == user_id)
    res = await session.execute(stmt)
    user = res.scalar()
    print(user)
    if user:
        return request_model.UserInDB(user_id=str(user.user_id),
                                      email=user.email,
                                      first_name=user.first_name,
                                      last_name=user.last_name,
                                      hashed_password=user.password_hash,
                                      is_driver=user.is_driver)


async def authenticate_user(session: Session, username: str, password: str):
    user = await get_user(session, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
