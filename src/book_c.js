const { query } = require('./db')
const { respond_err, error_c } = require('./error_c')
const { HttpStatus } = require('./consts')

const MIN_NAME_L = 0;
const MIN_EMAIL_L = 8;
const MIN_PASSWORD_L = 8;
const MAX_NAME_L = 40;
const MAX_EMAIL_L = 40;
const MAX_PASSWORD_L = 18;

class book_c {
     constructor(){}
     
     async get_books(_, res) {

          try {
               const q = 'SELECT * FROM books';
               const { rows } = await query(q);

               if(rows.length === 0) {
                    throw new error_c('Books is empty', HttpStatus.BAD_REQUEST)
               }

               res.end(JSON.stringify(rows))
          } catch(e) {
               respond_err(e, res)
          }

     }

     async post_book(req, res) {

          req.on('data', async chunk => {
               try {
                    let convertedDate;
                    const body = await JSON.parse(chunk.toString())
                    const { name, author, pub_date, synopsis, iduser } = body;

                    if(!name || !author || !pub_date) 
                         throw new error_c('Some parameters were not given.', HttpStatus.MULTIPLE_CHOICES)

                    const findBook = await query('SELECT * FROM books where name like $1', [name]);

                    if(findBook.rows.length > 0) {
                         throw new error_c('Book already registered.', HttpStatus.BAD_REQUEST)
                    }

                    if(!synopsis) synopsis = '';

                    if(synopsis && !(1 <= synopsis.length && synopsis.length <= HttpStatus.MULTIPLE_CHOICES))
					throw new error_c('Synopsis out of bounds.', HttpStatus.MULTIPLE_CHOICES);

				if(!(MIN_NAME_L <= name.length && name.length <= MAX_NAME_L))
					throw new error_c('Name length is not within bounds.', HttpStatus.MULTIPLE_CHOICES);

				if(!(MIN_NAME_L <= author.length && author.length <= MAX_NAME_L))
					throw new error_c('Author name length is not within bounds.', HttpStatus.MULTIPLE_CHOICES);

                    if(pub_date) {
                         convertedDate = new Date(pub_date);
                    }

                    const v = [ name, author, convertedDate, synopsis, iduser ]     
                    const q = 'INSERT INTO books (name,author,pub_date,synopsis,iduser) VALUES ($1,$2,$3,$4,$5)'
                    await query(q, v)

                    res.writeHead(201, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ msg: 'Book posted.'} ));
               } catch(e) {
                    respond_err(e, res)
               }
          })

     }
}

module.exports = book_c;