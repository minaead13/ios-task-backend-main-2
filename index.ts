import { H3, HTTPError, serve, defineWebSocketHandler, readBody } from 'h3';
import { plugin as ws } from 'crossws/server';
import { websocketHooks, publishMessageToPeers } from './ws.ts';
import { faker } from '@faker-js/faker';
import { consola } from 'consola';

const ORDER_STATUSES = [
  'preparing',
  'delivered',
  'cancelled',
  'ready',
  'out-for-delivery',
] as const;

const orders = [
  // An order with a constant id for easier testing
  {
    id: `order1`,
    customerName: faker.person.firstName(),
    restaurant: faker.company.name(),
    status: faker.helpers.arrayElement(ORDER_STATUSES),
  },
  ...Array.from({ length: 100 }).map(() => ({
    id: `order${faker.number.int({ min: 2, max: 1000 })}`,
    customerName: faker.person.firstName(),
    restaurant: faker.company.name(),
    status: faker.helpers.arrayElement(ORDER_STATUSES),
  })),
];

const app = new H3();

app.get('/orders', (event) => {
  consola.info('GET /orders', event);
  return orders;
});

app.get('/orders/:id', (event) => {
  consola.info('GET /orders/:id', event);

  const id = event.context.params?.id;
  if (!id) {
    throw HTTPError.status(404, "Couldn't read the order id");
  }

  const order = orders.find((order) => order.id === id);
  if (!order) {
    throw HTTPError.status(404, `Couldn't find the order with id=${id}`);
  }

  return order;
});

app.patch('/orders/:id/status', async (event) => {
  consola.info('PATCH /orders/:id/status', event);
  
  const id = event.context.params?.id;
  if (!id) {
    throw HTTPError.status(404, "Couldn't read the order id");
  }

  const order = orders.find((order) => order.id === id);
  if (!order) {
    throw HTTPError.status(404, `Couldn't find the order with id=${id}`);
  }

  const body = await readBody<{ status: string }>(event);
  const availableStatuses = ORDER_STATUSES.join(', ');
  if (!body?.status) {
    throw HTTPError.status(
      400,
      `Couldn't read the status in the request body. Available statuses are: ${availableStatuses}`,
    );
  }

  const status = ORDER_STATUSES.find((status) => status === body.status);
  if (!status) {
    throw HTTPError.status(
      400,
      `'${body.status}' is an invalid status. Available statuses are: ${availableStatuses}`,
    );
  }

  if (order.status === body.status) {
    event.res.status = 200;
    return {
      order,
      message: `Order #${id} is already in status: ${body.status}`,
    };
  }

  // Update the order status
  const previousStatus = order.status;
  order.status = status;

  const message = `Updated order #${id} status from ${previousStatus} to ${status}`;
  publishMessageToPeers({ orderId: id, status });
  consola.info(message);
  return { order, message };
});

app.get('/orders/updates', defineWebSocketHandler(websocketHooks));

serve(app, {
  port: 8080,
  plugins: [ws({ resolve: async (req) => (await app.fetch(req)).crossws })],
});
