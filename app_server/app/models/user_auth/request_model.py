from pydantic import BaseModel
from typing import Union


class CreateUser(BaseModel):
    email: str
    password: str
    isDriver: Union[bool, None] = False
    firstName: str
    lastName: str

class ChangePassword(BaseModel):
    new_password: str
    confirm_new_password: str

class ChangeUserInformation(BaseModel):
    new_first_name: str
    new_last_name: str

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Union[str, None] = None


class User(BaseModel):
    user_id: str
    email: Union[str, None] = None
    first_name: Union[str, None] = None
    last_name: Union[str, None] = None
    disabled: Union[bool, None] = False
    is_driver: Union[bool, None] = False

class UserInDB(User):
    hashed_password: str