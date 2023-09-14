const client = Bun.serve({
    port: 3000,
    fetch(request) {
      return new Response("Welcome to TurBun client!");
    },
  });