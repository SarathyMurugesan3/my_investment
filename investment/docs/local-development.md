# Local Development Guide

## Setup Steps

1. **Clone the repository**
2. **MongoDB Setup**
   - Ensure local MongoDB runs on `localhost:27017`
3. **Start the Backend**
   - Import `backend` maven module.
   - Run `mvn spring-boot:run` or launch `BackendApplication.java`
4. **Start the Frontend**
   - Open terminal in `frontend/`
   - Run `npm install`
   - Run `npm run dev`
5. **No Credentials Needed**
   - By default `MARKET_DATA_PROVIDER=MOCK` is active, supplying realistic indices feed.
