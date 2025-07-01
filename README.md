# ios-task-backend

### Local development

- Install [Node](https://nodejs.org/en/download) LTS (v22.15.0) or later
- Enable corepack by running `corepack enable` (run `sudo corepack enable` if you get an error)
- Install dependencies by running `pnpm install`
- Run the server by running `pnpm run dev`

### REST Endpoints

- `GET /orders` - Get all orders

  - **Response:** `Array<Order>`
  - **Sample Success Response:**
    ```json
    [
      {
        "id": "order1",
        "customerName": "John",
        "restaurant": "Pizza Palace",
        "status": "preparing"
      },
      ...
    ]
    ```

- `GET /orders/:id` - Get an order by id

  - **Response:** `Order` or `404 Not Found`
  - **Sample Success Response:**
    ```json
    {
      "id": "order1",
      "customerName": "John",
      "restaurant": "Pizza Palace",
      "status": "preparing"
    }
    ```

- `PATCH /orders/:id/status` - Update an order status

  - Request Body:

    ```json
      { "status": string }
    ```

  - **Available statuses:** `preparing`, `delivered`, `cancelled`, `ready`, `out-for-delivery`
  - **Response:**
    ```json
      { order: Order, message: string }
    ```
  - **Sample Request:**
    ```json
    {
      "status": "ready"
    }
    ```
  - **Sample Success Response:**
    ```json
    {
      "order": {
        "id": "order1",
        "customerName": "John",
        "restaurant": "Pizza Palace",
        "status": "ready"
      },
      "message": "Updated order #order1 status from preparing to ready"
    }
    ```

### WebSocket

- `GET /orders/updates` - WebSocket endpoint for real-time order status updates
  - **Connection Message:** `"Successfully connected to orders updates WebSocket endpoint"`
  - **Update Messages:** `{ "orderId": string, "status": string }`
  - **Sample Update:**
    ```json
    {
      "orderId": "order1",
      "status": "ready"
    }
    ```
