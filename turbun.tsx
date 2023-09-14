const service = Bun.serve({
  port: 4000,
  fetch(request) {
    return new Response("Welcome to TurBun service!");
  },
});

console.log(`Listening on service:${service.port}`);

const client = Bun.serve({
  port: 3000,
  fetch(request) {
    return new Response("Welcome to TurBun client!");
  },
});

console.log(`Listening on client:${client.port}`);
