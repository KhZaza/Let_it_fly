from app.database.models import Base

from sqlalchemy import create_mock_engine



with open("./db/init.sql", "w") as init_file:
    # mock function to capture sql command and output
    def dump(sql, *multiparams, **params):
        out = str(sql.compile(dialect=engine.dialect))+ ";"
        init_file.write(out)
    # create mock engine to run table creation
    engine = create_mock_engine('postgresql+psycopg2://', dump)
    Base.metadata.create_all(engine, checkfirst=False)
