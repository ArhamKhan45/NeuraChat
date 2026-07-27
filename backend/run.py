import uvicorn


if __name__ == "__main__":
    print("Starting the backend server...")

    uvicorn.run(
        "app.main:app",
        host="localhost",
        port=8000,
        reload=True,
    )