const service = Bun.serve({
    port: 4000,
    fetch(request) {
      return new Response("Welcome to TurBun service!");
    },
  });
  
  console.log(`Listening on service:${service.port}`);