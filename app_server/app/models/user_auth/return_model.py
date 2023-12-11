from pydantic import BaseModel
from typing import Union

class LoginResponse(BaseModel):
    success: bool = False
    token: Union[str, None] = None
    isDriver: bool = False

class PasswordChangeResponse(BaseModel):
    success: bool = False
    errorMessage: Union[str, None] = None

class UserInfoChangeResponse(BaseModel):
    success: bool = False
    errorMessage: Union[str, None] = None

class UserResponse(BaseModel):
    user_id: str
    firstName: str
    lastName: str
    isDriver: bool