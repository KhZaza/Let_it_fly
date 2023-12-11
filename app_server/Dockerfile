FROM python:3.9
RUN mkdir /app
WORKDIR /app
COPY requirements.txt /app
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt
COPY . /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]