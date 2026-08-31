const Typesense = require('typesense');

const client = new Typesense.Client({
  nodes: [
    {
      host: 'localhost',
      port: 8108,
      protocol: 'http',
    },
  ],
  apiKey: 'xyz',
});

async function run() {
  try {
    const searchResults = await client.collections('products').documents().search({
      q: '*',
      per_page: 5,
    });
    console.log(JSON.stringify(searchResults, null, 2));
  } catch (error) {
    console.error(error);
  }
}

run();
