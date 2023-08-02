const http = require('http')
const book_c = require('./book_c')
const user_c = require('./user_c')

const PORT = 8080

const book = new book_c();
const user = new user_c();

async function request_listener(req, res) {

     if(req.url === '/books' && req.method === 'GET') {

          const iduser = await user.authenticate(req, res);
          if(iduser) 
               return await book.get_books(req, res)

     } if(req.url === '/books' && req.method === 'POST') {
          
          const iduser = await user.authenticate(req, res);
          if(iduser) 
               return await book.post_book(req, res)

     } if (req.url === '/users' && req.method === 'POST') {

          return await user.post_user(req, res)

     } if(req.url === '/login' && req.method === 'POST') {

          return await user.login(req, res)

     } else {

		res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({ server_error: 'Route not found.' }));
          
	}
}

http.createServer(request_listener).listen(PORT, () => console.log('Server running'))