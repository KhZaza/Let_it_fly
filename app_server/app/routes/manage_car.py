from datetime import timedelta
from typing import Annotated
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.database import models
from app.routes.user_auth import get_current_active_user
from app.models.manage_car import request_model, return_model
from app.models.user_auth.request_model import User as u
from app import app, get_db


def convert_car_to_enum(car_type: request_model.CarChoice) -> models.CarEnum:
    if car_type == request_model.CarChoice.cargo:
        return models.CarEnum.cargo
    elif car_type == request_model.CarChoice.suv:
        return models.CarEnum.suv
    else:
        return models.CarEnum.sedan


CAR_ENUM_TO_STRING_MAP = {
    models.CarEnum.cargo: "CARGO",
    models.CarEnum.suv: "SUV",
    models.CarEnum.sedan: "SEDAN",
}


def convert_car_enum_to_string(car_type: models.CarEnum) -> str:
    return CAR_ENUM_TO_STRING_MAP[car_type]


@app.post("/api/car/retrieve")
async def retrieve_car(
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.RetrieveCarResponse:
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )

    stmt = select(models.Car).where(models.Car.driver_id == current_user.user_id)
    response = await db.execute(stmt)
    retrieved_car = response.scalar()

    if retrieved_car is None:
        raise HTTPException(
            status_code=400,
            detail="Driver hasn't registered a car yet!",
        )

    return return_model.RetrieveCarResponse(
        car_id=str(retrieved_car.car_id),
        car_name=str(retrieved_car.car_name),
        car_manufacturer=str(retrieved_car.car_manufactuer),
        car_type=convert_car_enum_to_string(retrieved_car.car_type),
    )


# @app.post("/api/car/create")
async def create_car(
    car: request_model.EditCar,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.CarResponse:
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )

    # select the type of car
    type_enum = convert_car_to_enum(car.carType)

    # create car and insert into db
    new_car = models.Car(
        driver_id=current_user.user_id,
        car_name=car.name,
        car_manufactuer=car.manufacturer,
        car_type=type_enum,
    )
    try:
        db.add(new_car)
        await db.commit()
        await db.refresh(new_car)
        return return_model.CarResponse(success=True, car_id=str(new_car.car_id))
    except:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Database error - Car may already be assigned to user",
        )


@app.post("/api/car/edit")
async def edit_car(
    car: request_model.EditCar,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.CarResponse:
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )

    if not car.carId:
        # car ID not provided, create new car
        return await create_car(car, current_user, db)

    stmt = (
        select(models.Car)
        .where(models.Car.car_id == car.carId)
        .where(models.Car.driver_id == current_user.user_id)
    )
    res = await db.execute(stmt)
    editing_car = res.scalar()  # returns single object or none

    if editing_car:
        if car.name is not None:
            editing_car.car_name = car.name
        if car.manufacturer is not None:
            editing_car.car_manufactuer = car.manufacturer
        if car.carType is not None:
            type_enum = convert_car_to_enum(car.carType)
            editing_car.car_type = type_enum
        try:
            await db.commit()
            await db.refresh(editing_car)
            return return_model.CarResponse(car_id=str(editing_car.car_id))
        except Exception as e:
            print(e)
            await db.rollback()
            raise HTTPException(status_code=400, detail="Car input is invalid")
    else:
        raise HTTPException(status_code=400, detail="Car input is invalid")
