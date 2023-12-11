import json
import datetime
from pytz import timezone, utc
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Time, between, select, cast, extract, union, asc, null, delete
from sqlalchemy.sql import func
import logging
from typing import Annotated
from geojson_pydantic import Point


from app.database import models
from app.redis import r
from app.models.reservation import request_model, return_model
from app.models.position.request_model import CreateRoutePosition
from app.models.manage_car.request_model import CarChoice
from app.models.position.request_model import GetNearbyPoint, GetPositionById
from app.routes.user_auth import get_current_active_user
from app.models.user_auth.request_model import User as u
from app.models.ride.return_model import PassengerDetails
from app.routes.driver import driver_status, get_driver_status
from app.routes.position import get_route, get_position_nearby
from app.routes.position import get_position_id
from app.mapping import models as map_model
from app import app, get_db

CAR_MAPPING_TABLE = {
    CarChoice.sedan: models.CarEnum.sedan,
    CarChoice.suv: models.CarEnum.suv,
    CarChoice.cargo: models.CarEnum.cargo,
}

INVERSE_CAR_MAPPING_TABLE = {
    models.CarEnum.sedan: CarChoice.sedan,
    models.CarEnum.suv: CarChoice.suv,
    models.CarEnum.cargo: CarChoice.cargo,
}

RIDE_MAPPING_TABLE = {
    request_model.ReservationChoice.reservation: models.ReservationEnum.reservation,
    request_model.ReservationChoice.on_demand: models.ReservationEnum.on_demand,
    request_model.ReservationChoice.on_demand_car_share: models.ReservationEnum.shared,
}

INVERSE_RIDE_MAPPING_TABLE = {
    models.ReservationEnum.reservation: request_model.ReservationChoice.reservation,
    models.ReservationEnum.on_demand: request_model.ReservationChoice.on_demand,
    models.ReservationEnum.shared: request_model.ReservationChoice.on_demand_car_share,
}


CAR_KEY_TABLE = {
    CarChoice.sedan: "SEDAN",
    CarChoice.suv: "SUV",
    CarChoice.cargo: "CARGO",
}


def map_user(row) -> return_model.DriverResponse:
    """Create a return object for each row in the select statement for search_reservation"""
    resp = return_model.DriverResponse(
        driverId=str(row.user_id),
        firstName=row.first_name,
        lastName=row.last_name,
        rating=0 if row.avg_review is None else int(row.avg_review),
        car=return_model.CarResponse(
            carId=str(row.car_id),
            carName=row.car_name,
            carManufacturer=row.car_manufactuer,
            carType=INVERSE_CAR_MAPPING_TABLE[row.car_type],
        ),
    )
    print(resp)
    return resp


async def search_reservation_reserved(
    reservation: request_model.ReservationQuery, db: Session = Depends(get_db)
) -> return_model.SearchResponse:
    car_type = CAR_MAPPING_TABLE[reservation.carType]
    search_time_no_cast = reservation.reservationTime
    # astimezone will shift the time to match pacific
    search_time = reservation.reservationTime.astimezone(
        timezone("US/Pacific")
    ).replace(tzinfo=utc)  # replace will drop the timezone info to do db compare in utc
    # select users and cars where the user is a driver with the desired car
    # and the user is available at given time
    subq = (
        select(
            func.avg(models.RideReview.review_stars).label("avg_review"),
            models.RideReview.driver_id,
        )
        .group_by(models.RideReview.driver_id)
        .subquery()
    )
    query = (
        select(
            models.User.user_id,
            models.User.first_name,
            models.User.last_name,
            models.Car.car_id,
            models.Car.car_name,
            models.Car.car_manufactuer,
            models.Car.car_type,
            subq.c.avg_review,
        )
        .join(models.Car, models.User.user_id == models.Car.driver_id)
        .where(models.User.user_id == models.Car.driver_id)
        .where(models.User.is_driver)
        .where(models.Car.car_type == car_type)
        .where(  # user is scheduled to drive at that time
            select(models.Schedule)
            .where(models.Schedule.driver_id == models.User.user_id)
            .where(models.Schedule.day_of_week == extract("isodow", search_time))
            .where(  # extract day of week from TIMESTAMP
                between(
                    cast(search_time, Time),
                    models.Schedule.start_time,
                    models.Schedule.end_time,
                )
            )
            .exists()
        )
        .where(
            ~select(models.Ride)
            .where(models.Ride.driver_id == models.User.user_id)
            .where(
                between(
                    search_time_no_cast,
                    models.Ride.schedule_time,
                    models.Ride.finish_time,
                )
            )
            .exists()
        )
        .join(subq, models.User.user_id == subq.c.driver_id, isouter=True)
    )
    print(query)
    # run query
    res = await db.execute(query)
    return return_model.SearchResponse(results=map(map_user, res.all()))


async def search_reservation_on_demand(
    reservation: request_model.ReservationQuery, db: Session = Depends(get_db)
) -> return_model.SearchResponse:
    """Searches for available drivers with the desired  car during the given time"""
    key = f"DRIVER/{CAR_KEY_TABLE[reservation.carType]}"
    # get drivers with matching car within 30 minute drivin distance
    pos_data = await get_position_nearby(
        GetNearbyPoint(searchPoint=reservation.pickupPoint, key=key)
    )
    print(pos_data)
    destination = reservation.destPoint
    dest_long, dest_lat = destination.coordinates[0], destination.coordinates[1]
    # filter for drivers headed the same direction
    print(dest_long, dest_lat)
    result_filter = create_filter(
        reservation.rideType == request_model.ReservationChoice.on_demand_car_share,
        dest_lat,
        dest_long,
    )
    available_driver_ids = list(
        map(
            lambda i: i.id,
            filter(result_filter, pos_data.points),
        )
    )
    print(available_driver_ids)
    # search db for driver details
    subq = (
        select(
            func.avg(models.RideReview.review_stars).label("avg_review"),
            models.RideReview.driver_id,
        )
        .group_by(models.RideReview.driver_id)
        .subquery()
    )
    query = (
        select(
            models.User.user_id,
            models.User.first_name,
            models.User.last_name,
            models.Car.car_id,
            models.Car.car_name,
            models.Car.car_manufactuer,
            models.Car.car_type,
            subq.c.avg_review,
        )
        .join(models.Car, models.User.user_id == models.Car.driver_id)
        .where(models.User.user_id == models.Car.driver_id)
        .where(models.User.is_driver)
        .where(models.User.user_id.in_(available_driver_ids))
        .join(subq, models.User.user_id == subq.c.driver_id, isouter=True)
    )
    # run query
    res = await db.execute(query)
    return return_model.SearchResponse(results=map(map_user, res.all()))


# TODO: Replace w/ SQL DB
PRICES_TABLE = {
    "ON_DEMAND": {"SEDAN": 7.5, "SUV": 8, "CARGO": 9.5},
    "RESERVATION": {"SEDAN": 5, "SUV": 6.5, "CARGO": 7.5},
    "ON_DEMAND_CAR_SHARE": {"SEDAN": 7.5, "SUV": 8, "CARGO": 9.5},
}

MIN_PRICE = 15


@app.post(
    "/api/price/table",
    summary="Retrieves a table of rates",
    tags=["Reservation Methods"],
)
async def price_table():
    return PRICES_TABLE


@app.post(
    "/api/reservation/price",
    summary="Retrieves the price for a given route",
    tags=["Reservation Methods"],
)
async def get_res_price(
    req: request_model.GetReservationPrice, db: Session = Depends(get_db)
) -> return_model.ReservationPrice:
    # create a direction object
    path = await get_route(
        route=CreateRoutePosition(steps=[req.pickupPoint, req.destPoint])
    )
    # get distance (meters) and convert to miles
    path_dist = path.distance / 1609  # convert from meters to miles
    price_rate = PRICES_TABLE[str(req.rideType)][str(req.carType)]
    calc_price = price_rate * path_dist

    # time based discounts
    if path.duration > 30 * 60:
        calc_price = 0.5 * calc_price
    elif path.duration > 15 * 60:
        calc_price = 0.7 * calc_price
    if calc_price < MIN_PRICE:
        calc_price = MIN_PRICE
    # format
    calc_price = round(calc_price, 2)
    path_dist = round(path_dist, 2)
    return return_model.ReservationPrice(
        price=calc_price, rate=price_rate, distance=path_dist, duration=path.duration
    )


@app.post("/api/reservation/search")
async def search_reservation(
    reservation: request_model.ReservationQuery, db: Session = Depends(get_db)
) -> return_model.SearchResponse:
    """Searches for available drivers with the desired  car during the given time"""
    if reservation.rideType == request_model.ReservationChoice.reservation:
        return await search_reservation_reserved(reservation, db)
    else:
        return await search_reservation_on_demand(reservation, db)


def create_filter(is_shared: bool, dest_lat: float, dest_long: float):
    if not is_shared:
        # only return results not in ride
        return lambda i: not i.driverData.in_ride
    else:
        # can be not in ride or in a ride with few passengers
        return lambda i: not i.driverData.in_ride or (
            i.driverData.share_enabled
            and i.driverData.ride_passengers < 2
            and i.driverData.dest_long == dest_long
            and i.driverData.dest_lat == dest_lat
        )


async def create_shared_update(
    drive_status,
    price,
    reservation: request_model.CreateReservation,
    db: Session = Depends(get_db),
) -> return_model.SharedReservationCreationResponse:
    # check for existing share request
    share_key = f"SHARE/{drive_status.ride_id}"
    req = await r.get(share_key)
    if req is not None:
        raise HTTPException(400, "Driver already has a pending share request")
    # Enter a location to retrieve later
    query = select(models.Ride).where(models.Ride.ride_id == drive_status.ride_id)
    res = await db.execute(query)
    ride = res.scalar()
    query = select(models.Location).where(
        models.Location.location_id == ride.dropoff_location_id
    )
    res = await db.execute(query)
    end_location = res.scalar()
    source_location = reservation.pickupPoint
    loc = models.Location(
        lat=source_location.coordinates[1],
        long=source_location.coordinates[0],
        address=source_location.properties.address,
        location_index=end_location.location_index,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    # alert the driver that there is a share request
    driver_key = f"DRIVER/REQUEST/{reservation.driverId}"
    new_request = return_model.ShareRequest(
        rideId=drive_status.ride_id,
        locationId=str(loc.location_id),
        passengerId=source_location.properties.passengerId,
        dist=price.distance,
        price=price.price,
        duration=price.duration,
    )
    data = json.dumps(new_request.dict())
    await r.set(driver_key, data)
    # create an object for the passenger to track the status
    share_key = f"SHARE/{drive_status.ride_id}"
    request_tracker = return_model.ShareAccepted(
        passengerId=source_location.properties.passengerId,
    )
    data = json.dumps(request_tracker.dict())
    await r.set(share_key, data)
    # return a boolean to tell client to track ride id
    return return_model.ReservationCreationResponse(
        success=True, rideId=str(drive_status.ride_id), waiting=True
    )


@app.post("/api/driver/share/accept")
async def accept_share(
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """Driver accepts ride share request"""
    req = await r.get(f"DRIVER/REQUEST/{current_user.user_id}")
    if req is None:
        raise HTTPException(400, "Share request does not exist")
    req = return_model.ShareRequest.parse_obj(json.loads(req))
    # update the end location
    query = select(models.Ride).where(models.Ride.ride_id == req.rideId)
    res = await db.execute(query)
    ride = res.scalar()
    if ride is None:
        raise HTTPException(400, "Ride does not exist")
    query = select(models.Location).where(
        models.Location.location_id == ride.dropoff_location_id
    )
    res = await db.execute(query)
    end_location = res.scalar()
    if end_location is None:
        raise HTTPException(400, "End Location does not exist")
    end_location.location_index = end_location.location_index + 1
    # create a new ride passenger
    passenger = models.RidePassenger(
        passenger_id=req.passengerId,
        pickup_location_id=req.locationId,
        ride_id=req.rideId,
        ride_dist=req.dist,
        ride_cost=req.price,
    )
    db.add(passenger)
    await db.commit()
    # update all passengers with a $10 discount
    stmt = select(models.RidePassenger).where(
        models.RidePassenger.ride_id == req.rideId
    )
    res = await db.execute(stmt)
    for passenger in res.scalars().all():
        passenger.ride_cost = passenger.ride_cost - 10
    await db.commit()
    # add a new passenger to cache
    cust_key = f"PASSENGER/{req.passengerId}"
    cust_data = PassengerDetails(rideId=req.rideId)
    cust_data = json.dumps(cust_data.dict())
    await r.set(cust_key, cust_data)
    # tell the waiting passenger that ride has been accepted
    share_key = f"SHARE/{req.rideId}"
    request_tracker = return_model.ShareAccepted(
        accepted=True,
        passengerId=req.passengerId,
    )
    data = json.dumps(request_tracker.dict())
    await r.set(share_key, data)
    # update state
    driver_data = await driver_status(current_user)
    driver_data.ride_passengers += 1
    data = json.dumps(driver_data.dict())
    key = f"DRIVER/{current_user.user_id}"
    await r.set(key, data)
    # delete the request
    req = await r.getdel(f"DRIVER/REQUEST/{current_user.user_id}")
    return {"success": True}


@app.post("/api/driver/share/decline")
async def decline_share(
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """Driver accepts ride share request"""
    req = await r.get(f"DRIVER/REQUEST/{current_user.user_id}")
    if req is None:
        raise HTTPException(400, "Share request does not exist")
    req = return_model.ShareRequest.parse_obj(json.loads(req))
    # delete the location
    stmt = delete(models.Location).where(models.Location.location_id == req.locationId)
    await db.execute(stmt)
    await db.commit()
    
    # tell the waiting passenger that ride has been declined by revoking the request
    share_key = f"SHARE/{req.rideId}"
    await r.getdel(share_key)
    # delete the request
    await r.getdel(f"DRIVER/REQUEST/{current_user.user_id}")
    return {"success": True}

@app.post("/api/driver/share/requests")
async def driver_share_request(
    current_user: Annotated[u, Depends(get_current_active_user)],
) -> return_model.ShareRequest:
    share_key = f"DRIVER/REQUEST/{current_user.user_id}"
    data = await r.get(share_key)
    if data is None:
        raise HTTPException(400, "Share request does not exist")
    return return_model.ShareRequest.parse_obj(json.loads(data))


@app.post("/api/reservation/share/status")
async def share_status(req: request_model.GetItinerary) -> return_model.ShareAccepted:
    share_key = f"SHARE/{req.rideId}"
    data = await r.get(share_key)
    if data is None:
        raise HTTPException(400, "Share request does not exist")
    return return_model.ShareAccepted.parse_obj(json.loads(data))


@app.post("/api/reservation/create")
async def create_reservation(
    reservation: request_model.CreateReservation, db: Session = Depends(get_db)
) -> return_model.ReservationCreationResponse:
    # search for distance
    

    query = select(models.Car).where(models.Car.driver_id == reservation.driverId)
    car = await db.execute(query)
    car = car.scalar()
    if car is None:
        raise HTTPException(400, "Driver does not have an assigned car")
    price = await get_res_price(
        request_model.GetReservationPrice(
            destPoint=reservation.destPoint,
            pickupPoint=reservation.pickupPoint,
            carType=INVERSE_CAR_MAPPING_TABLE[car.car_type],
            rideType=reservation.rideType,
        )
    )
    # check to ensure driver is active
    if reservation.rideType == request_model.ReservationChoice.on_demand or reservation.rideType == request_model.ReservationChoice.on_demand_car_share:
        drive_status = await get_driver_status(f"DRIVER/{reservation.driverId}")
        # check driver status to see if in a ride and branch if it is a shared ride
        if reservation.rideType == request_model.ReservationChoice.on_demand_car_share:
            if drive_status.in_ride:
                return await create_shared_update(drive_status, price, reservation, db)
    # set ride time depending on reservation type
    ride_time = (
        reservation.reservationTime
        if reservation.rideType == request_model.ReservationChoice.reservation
        else datetime.datetime.now()
    )
    # TODO - timezone conversion

    try:
        # create locations
        dropoff_location = models.Location(
            lat=reservation.destPoint.coordinates[1],
            long=reservation.destPoint.coordinates[0],
            address=reservation.destPoint.properties.address,
            location_index=1,
        )
        pickup_location = models.Location(
            lat=reservation.pickupPoint.coordinates[1],
            long=reservation.pickupPoint.coordinates[0],
            address=reservation.pickupPoint.properties.address,
            location_index=0,
        )
        locations = [pickup_location, dropoff_location]
        # add to db
        db.add_all(locations)
        await db.flush()
        for i in locations:
            await db.refresh(i)
        # create ride
        ride = models.Ride(
            driver_id=reservation.driverId,
            created_at=datetime.datetime.now(),
            schedule_time=ride_time,
            finish_time=ride_time
            + datetime.timedelta(seconds=price.duration),  # route.duration),
            dropoff_location_id=dropoff_location.location_id,
            is_complete=False,
            ride_type=RIDE_MAPPING_TABLE[reservation.rideType],
        )
        db.add(ride)
        await db.flush()
        await db.refresh(ride)

        for i in locations:
            await db.refresh(i)
        # create passengers
        passenger = models.RidePassenger(
            passenger_id=reservation.pickupPoint.properties.passengerId,
            pickup_location_id=pickup_location.location_id,
            ride_id=ride.ride_id,
            ride_dist=price.distance,
            ride_cost=price.price,
        )

        db.add(passenger)
        await db.flush()
        # persist changes to disk
        await db.commit()
        await db.refresh(ride)
        return return_model.ReservationCreationResponse(
            success=True, rideId=str(ride.ride_id)
        )
    except Exception as e:
        logging.exception(e)
        await db.flush()
        await db.rollback()
        return return_model.ReservationCreationResponse(success=False)


@app.post("/api/reservation/itinerary/get")
async def get_itinerary(
    search_q: request_model.GetItinerary, db: Session = Depends(get_db)
) -> return_model.ReservationIten:
    ride_id = search_q.rideId
    query = union(
        # retrieve locations of passengers and their id
        select(
            models.Location.long,
            models.Location.lat,
            models.Location.address,
            models.Location.location_index,
            models.RidePassenger.passenger_id,
        )
        .join(
            models.RidePassenger,
            models.RidePassenger.pickup_location_id == models.Location.location_id,
        )
        .join(
            models.Ride,
            models.Ride.ride_id == models.RidePassenger.ride_id,
        )
        .where(models.Ride.ride_id == ride_id),
        # retrieve destination location
        select(
            models.Location.long,
            models.Location.lat,
            models.Location.address,
            models.Location.location_index,
            null().label("passenger_id"),  # dummy passenger id column for union to work
        )
        .join(
            models.Ride,
            models.Ride.dropoff_location_id == models.Location.location_id,
        )
        .where(models.Ride.ride_id == ride_id),
    ).order_by(asc(models.Location.location_index))
    print(query)
    res = await db.execute(query)
    output = map(
        lambda val: request_model.AnnotatedPoint(
            type="Point",
            coordinates=[val.long, val.lat],
            properties=request_model.AnnotatedProperties(
                address=val.address,
                index=val.location_index,
                passengerId=str(val.passenger_id)
                if val.passenger_id is not None
                else None,
            ),
        ),
        res.all(),
    )
    return return_model.ReservationIten(steps=output)


@app.post("/api/reservation/details/get")
async def get_details(
    search_q: request_model.GetItinerary, db: Session = Depends(get_db)
) -> return_model.RideDetails:
    query = select(models.Ride).where(models.Ride.ride_id == search_q.rideId)
    res = await db.execute(query)
    ride = res.scalar()
    print(ride)
    if ride is None:
        raise HTTPException(400, "No ride found with ID")

    pass_search_q = (
        select(models.RidePassenger.passenger_id)
        .where(models.RidePassenger.ride_id == ride.ride_id)
        .distinct()
    )
    res = await db.execute(pass_search_q)
    pass_ids = map(lambda i: str(i.passenger_id), res.all())
    print(f"{ride.ride_id} {ride.driver_id} {ride.schedule_time}")
    return return_model.RideDetails(
        rideId=str(ride.ride_id),
        driverId=str(ride.driver_id),
        scheduleTime=ride.schedule_time,
        rideType=INVERSE_RIDE_MAPPING_TABLE[ride.ride_type],
        passengerIds=pass_ids,
    )

async def step_filter(step):
    if step.properties.passengerId is None:
        return True
    cust_key = f"PASSENGER/{step.properties.passengerId}"
    data = await r.get(cust_key)
    if data is None:
        return True
    passenger_state = PassengerDetails.parse_obj(json.loads(data))
    return not passenger_state.pickedUp

async def filter_steps(steps):
    return [step for step in steps if await step_filter(step)]

@app.post("/api/reservation/route/get")
async def get_res_route(
    route: request_model.GetItinerary, 
    current_user: Annotated[u, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
) -> map_model.AnnotatedTurn:
    iten = await get_itinerary(search_q=route, db=db)
    # if driver, route to destination and remove already picked up passengers
    if current_user.is_driver:
        key = f"DRIVER/{current_user.user_id}"
        driver_state = await r.get(key)
        if driver_state is not None:
            pos = await get_position_id(GetPositionById(id=current_user.user_id), db)
            steps = await filter_steps(iten.steps)
            steps.insert(0, Point(type="Point", coordinates=[pos.long, pos.lat]))
            return await get_route(route=CreateRoutePosition(steps=steps))
    return await get_route(route=CreateRoutePosition(steps=iten.steps))
