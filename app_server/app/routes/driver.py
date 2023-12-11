import json
from typing import Annotated
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc, select, delete, Date
from sqlalchemy.sql import func

from app.redis import geo_position
from app.database import models
from app.routes.user_auth import get_current_active_user
from app.routes.manage_car import convert_car_enum_to_string
from app.models.driver import request_model, return_model
from app.models.user_auth.request_model import User as u
from app.redis import r
from app import app, get_db

day_of_week_mapping_table = {
    request_model.DayChoice.mon: 1,
    request_model.DayChoice.tues: 2,
    request_model.DayChoice.wed: 3,
    request_model.DayChoice.thurs: 4,
    request_model.DayChoice.fri: 5,
    request_model.DayChoice.sat: 6,
    request_model.DayChoice.sun: 7,
}

number_to_day_mapping_table = {
    1: request_model.DayChoice.mon,
    2: request_model.DayChoice.tues,
    3: request_model.DayChoice.wed,
    4: request_model.DayChoice.thurs,
    5: request_model.DayChoice.fri,
    6: request_model.DayChoice.sat,
    7: request_model.DayChoice.sun,
}


@app.post("/api/driver/schedule/edit", tags=["Driver Methods"])
async def edit_schedule(
    day: request_model.EditSchedule,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.EditScheduleResponse:
    """Edit the schedule on the given day

    :param day: The day of the week and time to edit/add
    :type day: request_model.EditSchedule
    :param current_user: The current logged in user
    :type current_user: Annotated[u, Depends
    :param db: The database session object, defaults to Depends(get_db)
    :type db: Session, optional
    :raises HTTPException: 403 Driver restriction
    :raises HTTPException: 400 End time before start time error
    :return: Status
    :rtype: return_model.EditScheduleResponse
    """
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    # validate time range
    if day.endTime < day.startTime:
        raise HTTPException(
            status_code=400, detail="End time needs to be before start time"
        )
    try:
        day_num = day_of_week_mapping_table[day.day]

        if day.scheduleId is None:
            new_sched = models.Schedule(
                driver_id=current_user.user_id,
                day_of_week=day_num,
                start_time=day.startTime,
                end_time=day.endTime,
            )

            db.add(new_sched)
            await db.commit()
            await db.refresh(new_sched)
        else:
            query = select(models.Schedule).where(models.Schedule.id == day.scheduleId)
            row_result = await db.execute(query)
            new_sched = row_result.scalar()
            if new_sched is None:
                raise HTTPException(status_code=400, detail="Invalid ID")
            new_sched.driver_id=current_user.user_id
            new_sched.day_of_week=day_num
            new_sched.start_time=day.startTime
            new_sched.end_time=day.endTime
            await db.commit()
            await db.refresh(new_sched)

        # compaction, remove overlapping times using greedy algo
        query = (
            select(models.Schedule)
            .where(models.Schedule.driver_id == current_user.user_id)
            .where(models.Schedule.day_of_week == day_num)
            .order_by(asc(models.Schedule.start_time))
        )
        removal_list = []
        res = await db.execute(query)
        prev = None
        for row in res.scalars().all():
            # if row overlaps with one preceding it, merge
            if prev is not None and row.start_time <= prev.end_time:
                prev.end_time = row.end_time
                removal_list.append(row.id)
            else:
                prev = row
        # remove UUIDs that overlap
        print(removal_list)
        stmt = delete(models.Schedule).where(models.Schedule.id.in_(removal_list))
        res = await db.execute(stmt)
        await db.commit()

        return return_model.EditScheduleResponse(success=True)
    except Exception as e:
        print(e)
        await db.rollback()
        return return_model.EditScheduleResponse(
            success=False, errorMessage="Internal server error"
        )


@app.post("/api/driver/schedule/delete", tags=["Driver Methods"])
async def delete_schedule(
    day: request_model.DeleteSchedule,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.EditScheduleResponse:
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    try:
        stmt = (
            delete(models.Schedule)
            .where(models.Schedule.id == day.blockId)
            .where(models.Schedule.driver_id == current_user.user_id)
        )
        await db.execute(stmt)
        await db.commit()

        return return_model.EditScheduleResponse(success=True)
    except Exception as e:
        print(e)
        await db.rollback()
        return return_model.EditScheduleResponse(
            success=False, errorMessage="Internal server error"
        )


@app.post("/api/driver/schedule/retrieve", tags=["Driver Methods"])
async def retrieve_schedule(
    user_id: request_model.RetrieveSchedule, db: Session = Depends(get_db)
) -> return_model.ScheduleResponse:
    stmt = (
        select(models.Schedule)
        .where(models.Schedule.driver_id == user_id.driverId)
        .order_by(asc(models.Schedule.day_of_week))
        .order_by(asc(models.Schedule.start_time))
    )
    response = await db.execute(stmt)
    resp = return_model.ScheduleResponse(
        driverId=user_id.driverId,
        schedule=map(
            lambda row: return_model.ScheduleObject(
                id=str(row.id),
                dayOfWeek=number_to_day_mapping_table[row.day_of_week],
                startTime=row.start_time,
                endTime=row.end_time,
            ),
            response.scalars().all(),
        ),
    )

    print(resp)
    return resp


@app.post("/api/driver/reservations/get", tags=["Driver Methods"])
async def retrieve_res(
    data: request_model.RetrieveReservations,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.TotalSchedule:
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    subq = (
        select(
            func.sum(models.RidePassenger.ride_cost).label("total_price"),
            models.RidePassenger.ride_id,
        )
        .group_by(models.RidePassenger.ride_id)
        .subquery()
    )
    query = (
        select(
            models.Ride.ride_id,
            models.Ride.schedule_time,
            models.Location.address,
            subq.c.total_price,
        )
        .join(subq, models.Ride.ride_id == subq.c.ride_id)
        .where(models.Ride.driver_id == current_user.user_id)
        .where(models.Ride.dropoff_location_id == models.Location.location_id)
        .where(models.Ride.is_complete == False)
    )
    if data.date is not None:
        query = query.where(models.Ride.schedule_time.cast(Date) == data.date)
    query = query.order_by(asc(models.Ride.schedule_time))
    print(query)
    res = await db.execute(query)
    rides = map(
        lambda val: return_model.ReservationResponse(
            rideId=str(val.ride_id),
            reservationTime=val.schedule_time,
            address=val.address,
            price=val.total_price,
        ),
        res.all(),
    )
    return return_model.TotalSchedule(rides=list(rides))


@app.post("/api/driver/reservations/history", tags=["Driver Methods"])
async def retrieve_res_history(
    data: request_model.RetrieveReservations,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.TotalSchedule:
    # protect API if user is not a driver
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    subq = (
        select(
            func.sum(models.RidePassenger.ride_cost).label("total_price"),
            models.RidePassenger.ride_id,
        )
        .group_by(models.RidePassenger.ride_id)
        .subquery()
    )
    query = (
        select(
            models.Ride.ride_id,
            models.Ride.schedule_time,
            models.Location.address,
            subq.c.total_price,
        )
        .join(subq, models.Ride.ride_id == subq.c.ride_id)
        .where(models.Ride.driver_id == current_user.user_id)
        .where(models.Ride.dropoff_location_id == models.Location.location_id)
        .where(models.Ride.is_complete == True)
    )
    query = query.order_by(asc(models.Ride.schedule_time))
    print(query)
    res = await db.execute(query)
    rides = map(
        lambda val: return_model.ReservationResponse(
            rideId=str(val.ride_id),
            reservationTime=val.schedule_time,
            address=val.address,
            price=val.total_price,
        ),
        res.all(),
    )
    return return_model.TotalSchedule(rides=list(rides))


@app.post("/api/driver/checkin", tags=["Driver Methods"])
async def driver_checkin(
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    stmt = (
        select(models.User.user_id, models.Car.car_id, models.Car.car_type)
        .where(models.User.user_id == models.Car.driver_id)
        .where(models.User.user_id == current_user.user_id)
        .limit(1)
    )
    res = await db.execute(stmt)
    row = res.all()[0]
    if row is None:
        return {"success": False}
    save_data = return_model.DriverCache(
        car_id=str(row.car_id),
        car_type=convert_car_enum_to_string(row.car_type),
        in_ride=False,
        ride_passengers=0,
    )
    data = json.dumps(save_data.dict())
    key = f"DRIVER/{current_user.user_id}"
    await r.set(key, data)
    return {"success": True}


@app.post("/api/driver/checkout", tags=["Driver Methods"])
async def driver_checkout(
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    key = f"DRIVER/{current_user.user_id}"
    data = await r.getdel(key)
    driver_state = return_model.DriverCache.parse_obj(json.loads(data))
    pos_key = f"DRIVER/{driver_state.car_type}"
    pos = await geo_position.remove_geo_position(key=pos_key, name=current_user.user_id)
    if data is None:
        raise HTTPException(400, "Driver is not checked in before checkout")
    return json.loads(data)


async def get_driver_status(key: str) -> return_model.DriverCache:
    data = await r.get(key)
    if data is None:
        raise HTTPException(400, "Driver is not checked in")
    driver_state = return_model.DriverCache.parse_obj(json.loads(data))
    return driver_state


@app.post("/api/driver/status", tags=["Driver Methods"])
async def driver_status(
    current_user: Annotated[u, Depends(get_current_active_user)],
) -> return_model.DriverCache:
    key = f"DRIVER/{current_user.user_id}"
    return await get_driver_status(key)


@app.post("/api/driver/status/key", tags=["Driver Methods"])
async def driver_status_key(query: request_model.RetrieveSchedule):
    key = f"DRIVER/{query.driverId}"
    return await get_driver_status(key)
