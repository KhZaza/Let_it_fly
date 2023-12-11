CREATE TYPE carenum AS ENUM ('sedan', 'suv', 'cargo');CREATE TYPE reservationenum AS ENUM ('on_demand', 'reservation', 'shared');
CREATE TABLE users (
	user_id UUID NOT NULL, 
	email VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	is_driver BOOLEAN NOT NULL, 
	first_name VARCHAR NOT NULL, 
	last_name VARCHAR NOT NULL, 
	PRIMARY KEY (user_id), 
	UNIQUE (email)
)

;
CREATE TABLE locations (
	location_id UUID NOT NULL, 
	lat FLOAT NOT NULL, 
	long FLOAT NOT NULL, 
	address VARCHAR, 
	location_index INTEGER NOT NULL, 
	PRIMARY KEY (location_id)
)

;
CREATE TABLE cars (
	car_id UUID NOT NULL, 
	driver_id UUID, 
	car_name VARCHAR NOT NULL, 
	car_manufactuer VARCHAR NOT NULL, 
	car_type carenum NOT NULL, 
	PRIMARY KEY (car_id), 
	CONSTRAINT one_car_per_driver UNIQUE (driver_id), 
	UNIQUE (driver_id), 
	FOREIGN KEY(driver_id) REFERENCES users (user_id)
)

;
CREATE TABLE rides (
	ride_id UUID NOT NULL, 
	driver_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE, 
	schedule_time TIMESTAMP WITH TIME ZONE, 
	finish_time TIMESTAMP WITH TIME ZONE, 
	dropoff_location_id UUID, 
	is_complete BOOLEAN NOT NULL, 
	ride_type reservationenum NOT NULL, 
	PRIMARY KEY (ride_id), 
	FOREIGN KEY(driver_id) REFERENCES users (user_id), 
	FOREIGN KEY(dropoff_location_id) REFERENCES locations (location_id)
)

;
CREATE TABLE schedules (
	id UUID NOT NULL, 
	driver_id UUID, 
	day_of_week INTEGER NOT NULL, 
	start_time TIME WITHOUT TIME ZONE NOT NULL, 
	end_time TIME WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(driver_id) REFERENCES users (user_id)
)

;
CREATE TABLE ride_passengers (
	ride_pass_id UUID NOT NULL, 
	ride_id UUID, 
	passenger_id UUID, 
	pickup_location_id UUID, 
	ride_dist FLOAT NOT NULL, 
	ride_cost FLOAT NOT NULL, 
	PRIMARY KEY (ride_pass_id), 
	FOREIGN KEY(ride_id) REFERENCES rides (ride_id), 
	FOREIGN KEY(passenger_id) REFERENCES users (user_id), 
	FOREIGN KEY(pickup_location_id) REFERENCES locations (location_id)
)

;
CREATE TABLE ride_reviews (
	review_id UUID NOT NULL, 
	ride_id UUID, 
	driver_id UUID, 
	passenger_id UUID, 
	review_stars INTEGER, 
	review_body TEXT, 
	PRIMARY KEY (review_id), 
	CONSTRAINT one_per_passenger UNIQUE (ride_id, passenger_id), 
	FOREIGN KEY(ride_id) REFERENCES rides (ride_id), 
	FOREIGN KEY(driver_id) REFERENCES users (user_id), 
	FOREIGN KEY(passenger_id) REFERENCES users (user_id)
)

;