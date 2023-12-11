import json
from functools import reduce
from typing import Annotated
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc, select, Date
from app.models.user_auth.request_model import User as u
from app.database import models
from app.models.driver import request_model, return_model
from app.models.ride import request_model as req, return_model as ret
from app.models.reservation import request_model as res_req
from app.redis import r

from app import app, get_db
from app.routes.reservation import get_details, get_itinerary
from app.routes.user_auth import get_current_active_user
from app.routes.driver import driver_status, get_driver_status


@app.post("/api/customer/reservations/get", tags=["Customer Methods"])
async def retrieve_res(
    data: request_model.RetrieveReservations,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.TotalSchedule:
    # protect API if user is not a driver
    if current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a passenger to access the API"
        )
    query = (
        select(
            models.Ride.ride_id,
            models.Ride.schedule_time,
            models.Location.address,
            models.Ride.driver_id,
            models.RidePassenger.ride_cost,
        )
        .where(models.RidePassenger.passenger_id == current_user.user_id)
        .where(models.RidePassenger.ride_id == models.Ride.ride_id)
        .where(models.Ride.dropoff_location_id == models.Location.location_id)
        .where(models.Ride.is_complete == False)
    )
    if data.date is not None:
        query = query.where(models.Ride.schedule_time.cast(Date) == data.date)
    query = query.order_by(asc(models.Ride.schedule_time)).distinct()
    print(query)
    res = await db.execute(query)
    rides = map(
        lambda val: return_model.ReservationResponse(
            rideId=str(val.ride_id),
            reservationTime=val.schedule_time,
            address=val.address,
            price=val.ride_cost,
        ),
        res.all(),
    )
    return return_model.TotalSchedule(rides=list(rides))


@app.post("/api/customer/reservations/history", tags=["Customer Methods"])
async def retrieve_res_history(
    data: request_model.RetrieveReservations,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> return_model.TotalSchedule:
    # protect API if user is not a driver
    if current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a passenger to access the API"
        )
    query = (
        select(
            models.Ride.ride_id,
            models.Ride.schedule_time,
            models.Location.address,
            models.Ride.driver_id,
            models.RidePassenger.ride_cost,
        )
        .where(models.RidePassenger.passenger_id == current_user.user_id)
        .where(models.RidePassenger.ride_id == models.Ride.ride_id)
        .where(models.Ride.dropoff_location_id == models.Location.location_id)
        .where(models.Ride.is_complete == True)
    )
    query = query.order_by(asc(models.Ride.schedule_time)).distinct()
    print(query)
    res = await db.execute(query)
    rides = map(
        lambda val: return_model.ReservationResponse(
            rideId=str(val.ride_id),
            reservationTime=val.schedule_time,
            address=val.address,
            price=val.ride_cost,
        ),
        res.all(),
    )
    return return_model.TotalSchedule(rides=list(rides))


@app.post("/api/reservations/info", tags=["Customer Methods"])
async def retrieve_res_info(
    data: req.ReservationQuery,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    # protect API if user is not a driver
    if current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a passenger to access the API"
        )
    query = select(models.Ride).where(models.Ride.ride_id == data.id)
    print(query)
    res = await db.execute(query)
    v = res.scalar()
    return {"driver_id": v.driver_id}
    # return return_model.TotalSchedule(rides=list(rides))


@app.post("/api/driver/ride/start")
async def ride_start(
    ride_data: req.ReservationStart,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """signal that the driver has started the ride"""
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    driver_data = await driver_status(current_user)
    if driver_data.ride_id != "":
        raise HTTPException(400, "Driver is already in a ride")

    iten_search = res_req.GetItinerary(rideId=ride_data.rideId)

    ride_details = await get_details(iten_search, db=db)
    if ride_details.driverId != current_user.user_id:
        raise HTTPException(400, "Driver is not assigned to the ride")

    ride_iten = await get_itinerary(iten_search, db=db)

    dest = ride_iten.steps[-1]

    # TODO: Add time check
    driver_data.ride_id = ride_details.rideId
    driver_data.ride_passengers = len(ride_details.passengerIds)
    driver_data.in_ride = True
    driver_data.dest_long = dest.coordinates[0]
    driver_data.dest_lat = dest.coordinates[1]
    driver_data.share_enabled = (
        ride_details.rideType == res_req.ReservationChoice.on_demand_car_share
    )
    data = json.dumps(driver_data.dict())
    key = f"DRIVER/{current_user.user_id}"
    await r.set(key, data)
    # create passenger keys for each rider
    for cust_id in ride_details.passengerIds:
        cust_key = f"PASSENGER/{cust_id}"
        cust_data = ret.PassengerDetails(rideId=ride_data.rideId)
        cust_data = json.dumps(cust_data.dict())
        await r.set(cust_key, cust_data)
    return driver_data


@app.post("/api/passenger/status")
async def customer_status(
    ride_data: req.CustomerStatus,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> ret.PassengerDetails:
    """Signal that a user has been picked up"""
    cust_key = f"PASSENGER/{ride_data.custId}"
    data = await r.get(cust_key)
    print(data)
    if data is None:
        raise HTTPException(400, "Customer does not exist")
    passenger_state = ret.PassengerDetails.parse_obj(json.loads(data))
    return passenger_state


@app.post("/api/driver/ride/pickup")
async def customer_pickup(
    ride_data: req.CustomerPickup,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """Signal that a user has been picked up"""
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    # grab use object
    cust_key = f"PASSENGER/{ride_data.custId}"
    data = await r.get(cust_key)
    if data is None:
        raise HTTPException(400, "Customer does not exist")
    passenger_state = ret.PassengerDetails.parse_obj(json.loads(data))
    # check if they are assigned to the ride
    if passenger_state.rideId != ride_data.rideId:
        raise HTTPException(400, "Customer is not assigned to the ride")
    if passenger_state.pickedUp:
        raise HTTPException(400, "Customer Already picked up")
    # update the object
    passenger_state.pickedUp = True
    cust_data = json.dumps(passenger_state.dict())

    # update driver status
    # driver_data = await driver_status(current_user)
    # driver_data.ride_passengers += 1
    # data = json.dumps(driver_data.dict())
    # key = f"DRIVER/{current_user.user_id}"
    # await r.set(key, data)

    await r.set(cust_key, cust_data)
    return {"success": 1}


@app.post("/api/driver/ride/end")
async def ride_end(
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """Signal that a ride has ended"""
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a driver to access the API"
        )
    # grab use object
    driver_data = await driver_status(current_user)
    if driver_data.ride_id == "":
        raise HTTPException(400, "Driver needs to be in a ride")

    ride_details = await get_details(
        res_req.GetItinerary(rideId=driver_data.ride_id), db=db
    )
    
    for cust_id in ride_details.passengerIds:
        cust_key = f"PASSENGER/{cust_id}"
        cust_data = await r.get(cust_key)
        passenger_state = ret.PassengerDetails.parse_obj(json.loads(cust_data))
        if not passenger_state.pickedUp:
            raise HTTPException(400, "Driver has not picked up all passengers")
    # clear passenger rows in cache
    for cust_id in ride_details.passengerIds:
        cust_key = f"PASSENGER/{cust_id}"
        await r.getdel(cust_key)

    stmt = (
        select(models.Ride)
        .where(models.Ride.ride_id == driver_data.ride_id)
        .where(models.Ride.is_complete == False)
    )
    res = await db.execute(stmt)
    ride = res.scalar()
    if not ride:
        raise HTTPException(400, "Ride does not exist")
    # change in object
    ride.is_complete = True
    # commit object change to db
    await db.commit()
    await db.refresh(ride)

    # reset driver key
    driver_data.in_ride = False
    driver_data.dest_lat = 0
    driver_data.dest_long = 0
    driver_data.ride_passengers = 0
    driver_data.ride_id = ""
    data = json.dumps(driver_data.dict())
    key = f"DRIVER/{current_user.user_id}"
    await r.set(key, data)


@app.post("/api/ride/review")
async def ride_review(
    review_body: req.RideReview,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> ret.ReviewReturn:
    # filter for passenger not assigned to ride
    stmt = (
        select(models.RidePassenger)
        .where(models.RidePassenger.ride_id == review_body.rideId)
        .where(models.RidePassenger.passenger_id == current_user.user_id)
    )
    res = await db.execute(stmt)
    passenger = res.scalar()
    if not passenger:
        raise HTTPException(400, "Ride or passenger does not exist")
    stmt = (
        select(models.Ride)
        .where(models.Ride.ride_id == review_body.rideId)
        .where(models.Ride.is_complete == True)
    )
    # retrieve ride and return exception if it doesn't exist
    res = await db.execute(stmt)
    ride = res.scalar()
    if not ride:
        raise HTTPException(400, "Ride does not exist or is not complete")
    try:
        review = models.RideReview(
            ride_id=ride.ride_id,
            driver_id=ride.driver_id,
            passenger_id=current_user.user_id,
            review_stars=review_body.stars,
            review_body=review_body.reviewText,
        )
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return ret.ReviewReturn(reviewId=str(review.review_id))
    except:
        await db.rollback()
        raise HTTPException(400, "Reservation review already exists")


@app.post("/api/ride/review/id")
async def get_ride_review_by_id(
    data: req.ReviewIdQuery, db: Session = Depends(get_db)
) -> ret.RideReview:
    # get review info
    stmt = select(models.RideReview).where(models.RideReview.review_id == data.reviewId)
    res = await db.execute(stmt)
    rev = res.scalar()
    if rev is None:
        raise HTTPException(400, "Review does not exist")
    # get driver info
    stmt2 = select(models.User).where(models.User.user_id == rev.driver_id)
    res2 = await db.execute(stmt2)
    driver = res2.scalar()
    if driver is None:
        raise HTTPException(400, "Driver does not exist")
    return ret.RideReview(
        driverName=f"{driver.first_name} {driver.last_name}",
        driverId=str(rev.driver_id),
        reviewStars=rev.review_stars,
        reviewBody=rev.review_body,
    )


@app.post("/api/ride/review/driver")
async def get_ride_review_by_driver(
    data: req.ReviewDriverQuery, db: Session = Depends(get_db)
) -> ret.ReviewList:
    stmt2 = select(models.User).where(models.User.user_id == data.driverId)
    res2 = await db.execute(stmt2)
    driver = res2.scalar()
    if driver is None:
        raise HTTPException(400, "Driver does not exist")

    stmt = select(models.RideReview).where(models.RideReview.driver_id == data.driverId)
    res = await db.execute(stmt)
    data = list(
        map(
            lambda rev: ret.RideReview(
                driverName=f"{driver.first_name} {driver.last_name}",
                driverId=str(rev.driver_id),
                reviewStars=rev.review_stars,
                reviewBody=rev.review_body,
            ),
            res.scalars().all(),
        )
    )
    review_average = int(
        reduce(lambda a, b: a + b, map(lambda x: x.reviewStars, data)) / len(data)
    )
    return ret.ReviewList(reviews=data, reviewAvg=review_average)


@app.post("/api/ride/customer/status")
async def get_ride_status(
    ride_query: req.RideQuery,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> ret.CustomerRideState:
    if current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a passenger to access the API"
        )
    # select ride
    return_obj = ret.CustomerRideState()
    query = (
        select(models.Ride)
        .where(models.Ride.ride_id == ride_query.rideId)
        .where(models.RidePassenger.passenger_id == current_user.user_id)
        .where(models.Ride.ride_id == models.RidePassenger.ride_id)
    )
    res = await db.execute(query)
    ride = res.scalar()
    if not ride:
        raise HTTPException(400, "Ride does not exist")

    # set completed
    return_obj.complete = ride.is_complete
    # check state
    data = await r.get(f"DRIVER/{ride.driver_id}")
    if data is not None:
        driver_state = return_model.DriverCache.parse_obj(json.loads(data))
        return_obj.started = (
            driver_state.in_ride and driver_state.ride_id == ride_query.rideId
        )
    # check if ride review exists
    query_review = (
        select(models.RideReview)
        .where(models.RideReview.ride_id == ride_query.rideId)
        .where(models.RideReview.passenger_id == current_user.user_id)
    )
    res_rev = await db.execute(query_review)
    review = res_rev.scalar()
    return_obj.reviewCreated = review is not None
    if return_obj.reviewCreated:
        return_obj.reviewId = review.review_id
    return return_obj


@app.post("/api/ride/driver/status")
async def get_driver_ride_status(
    ride_query: req.RideQuery,
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
) -> ret.DriverRideState:
    if not current_user.is_driver:
        raise HTTPException(
            status_code=403, detail="Must be a passenger to access the API"
        )
    # select ride
    return_obj = ret.DriverRideState()
    query = (
        select(models.Ride)
        .where(models.Ride.ride_id == ride_query.rideId)
        .where(models.Ride.driver_id == current_user.user_id)
    )
    res = await db.execute(query)
    ride = res.scalar()
    if not ride:
        raise HTTPException(400, "Ride does not exist")

    # set completed
    return_obj.complete = ride.is_complete
    return_obj.isShared = ride.ride_type == models.ReservationEnum.shared
    return return_obj
