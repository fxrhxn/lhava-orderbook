# Lhava Orderbook Simulation

This repository contains a simulation of an orderbook using a server and frontend setup. Follow the steps below to clone, install, and run the project.

## Prerequisites
- Node.js (version 14 or above)
- npm (comes with Node.js)

---

## Getting Started

### Step 1: Clone the Repository

Clone this repository to your local machine using:

```bash
git clone https://github.com/fxrhxn/lhava-orderbook
```


### Step 2: Install Server Dependencies

Navigate to the server directory and install the required packages:


```bash
cd lhava-orderbook/orderbook-simulation
npm install
```

### Step 3: Run the Server

Start the orderbook simulation server:

```bash
node real-orderbook.js
```


### Step 4: Install Frontend Dependencies

In a new terminal window, navigate to the frontend directory and install its dependencies:

```bash
cd lhava-orderbook/orderbook-ui
npm install
```


### Step 5: Run the Frontend

Start the frontend application. The frontend will run on a local server, typically at http://localhost:3000.


```bash
npm start
```


## Project Structure

- **orderbook-simulation**: Contains the server-side code for the orderbook.
- **orderbook-ui**: Contains the frontend code for displaying the orderbook.

---

## Additional Notes

- Ensure that both the server and frontend are running simultaneously for full functionality.
- If you encounter any issues, please check your Node.js and npm versions.
