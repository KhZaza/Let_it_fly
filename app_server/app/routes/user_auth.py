from datetime import timedelta
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt

from app.database import models
from app.cryptography import utils as c
from app import app, get_db
from app.models.user_auth import request_model, return_model

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, c.SECRET_KEY, algorithms=[c.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = request_model.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await c.get_user(session=db, user_id=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[request_model.User, Depends(get_current_user)]
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@app.post('/register')
async def register(user: request_model.CreateUser, db: Session = Depends(get_db)):
    pass_hash = c.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        password_hash=pass_hash,
        is_driver=user.isDriver,
        first_name=user.firstName,
        last_name=user.lastName)
    print(db_user)
    try:
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return return_model.PasswordChangeResponse(success=True)
    except IntegrityError:
        db.rollback()
        return return_model.PasswordChangeResponse(success=False, errorMessage='Email is already in use')
    
@app.post('/change_user_info')
async def change_user_info(current_user: Annotated[request_model.User, Depends(get_current_active_user)],
                           new_user_info: request_model.ChangeUserInformation, db: Session = Depends(get_db)) -> return_model.UserInfoChangeResponse:
    response = return_model.UserInfoChangeResponse()

    if new_user_info.new_first_name == "" and new_user_info.new_last_name == "":
        response.errorMessage = "Enter a new first name or last name"
        return response
    
    try:
        stmt = select(models.User).where(models.User.user_id == current_user.user_id)
        res = await db.execute(stmt)
        user = res.scalar()
        if user:
            # change in object
            if new_user_info.new_first_name != "":
                user.first_name = new_user_info.new_first_name
            if new_user_info.new_last_name != "":
                user.last_name = new_user_info.new_last_name
        
            # commit object change to db
            await db.commit()
            await db.refresh(user)
            response.success = True
            return response
        else: # user doesn't exist
            response.errorMessage = 'User not found'
            return response
    except IntegrityError:
        await db.rollback()
        response.errorMessage = 'Internal server error'
        return response

    
@app.post('/change_password')
async def change_password(current_user: Annotated[request_model.User, Depends(get_current_active_user)],
                          password: request_model.ChangePassword, db: Session = Depends(get_db)) -> return_model.PasswordChangeResponse:
    # create a response
    resp = return_model.PasswordChangeResponse()

    # cancel if they do not match
    if password.new_password != password.confirm_new_password:
        resp.errorMessage = 'Your passwords must match'
        return resp

    # generate a password hash
    pass_hash = c.get_password_hash(password.new_password)

    try:
        # select a user
        stmt = select(models.User).where(models.User.user_id == current_user.user_id)
        res = await db.execute(stmt)
        user = res.scalar() # returns single object or none
        if user:
            # change in object
            user.password_hash = pass_hash
            # commit object change to db
            await db.commit()
            await db.refresh(user)
            resp.success = True
            return resp
        else: # user doesn't exist
            resp.errorMessage = 'User not found'
            return resp
    except IntegrityError:
        await db.rollback()
        resp.errorMessage = 'Internal server error'
        return resp
    


@app.post("/token", response_model=request_model.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Session = Depends(get_db)
):
    user = await c.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=c.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = c.create_access_token(
        data={"sub": user.user_id}, expires_delta=access_token_expires
    )
    return request_model.Token(access_token=access_token, token_type='bearer')


@app.get("/users/me/", response_model=request_model.User)
async def read_users_me(
    current_user: Annotated[request_model.User,
                            Depends(get_current_active_user)]
):
    return current_user

@app.post("/api/users/me", response_model=return_model.UserResponse)
async def read_me(current_user: Annotated[request_model.User, Depends(get_current_active_user)]):
    return return_model.UserResponse(user_id=current_user.user_id, firstName=current_user.first_name, lastName=current_user.last_name, isDriver=current_user.is_driver)

