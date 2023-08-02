const { query } = require('./db')
const { respond_err, error_c } = require('./error_c')
const { HttpStatus } = require('./consts')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JsonWebTokenError } = require('jsonwebtoken');

const MIN_NAME_L = 0;
const MIN_EMAIL_L = 8;
const MIN_PASSWORD_L = 8;
const MAX_NAME_L = 40;
const MAX_EMAIL_L = 40;
const MAX_PASSWORD_L = 18;
const EMAIL_REG = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

class user_c {
     constructor () {}

     async post_user(req, res) {
          
          req.on('data', async chunk => { 
               try {
                    const body = await JSON.parse(chunk.toString())
                    const { name, email, password } = body

                    /* check data validity */
                    if(!name || !email || !password)
                         throw new error_c('Some parameters are not defined.', HttpStatus.MULTIPLE_CHOICES);

                    if(!(MIN_NAME_L <= name.length && name.length <= MAX_NAME_L))
                         throw new error_c('Name can have at least 1 character and at most 40', HttpStatus.MULTIPLE_CHOICES);

                    if(!(MIN_EMAIL_L <= email.length && email.length <= MAX_EMAIL_L)
                         || !String(email).toLowerCase().match(EMAIL_REG))
                         throw new error_c('Either email is not between 8 and 40 character inclusive or it is not a valid email.', HttpStatus.MULTIPLE_CHOICES);

                    if(!(MIN_PASSWORD_L <= password.length && password.length <= MAX_PASSWORD_L))
                         throw new error_c('Password can have at least 8 character and at most 18', HttpStatus.MULTIPLE_CHOICES);

                    /* check if email is registered */

                    const email_q = 'SELECT * FROM users WHERE email = $1';
                    const email_v = [ email ]
                    const find_email_q = await query(email_q, email_v);
                    if(find_email_q.rows.length > 0)
                         throw new error_c('Email already registered.', HttpStatus.UNAUTHORIZED);

                    /* prep the password */

                    const hashed_password = bcrypt.hashSync(password, 10);

                    /* ok */
                    const user_q = 'INSERT INTO USERS (name, email, password) VALUES ($1,$2,$3)';
                    const user_v = [ name, email, hashed_password ]
                    await query(user_q, user_v)

                    res.writeHead(HttpStatus.CREATED, {'Content-Type':'application/json'});
                    res.end(JSON.stringify({ msg: 'User created.' }));
               } catch(e) {
                    respond_err(e, res)
               }
          })

     }

     async login(req, res) {

          req.on('data', async chunk => { 
               try {
                    const body = await JSON.parse(chunk.toString())
                    const { email, password } = body
                    
                    /* validity checks */	

                    if(!email || !password)
                         throw new error_c('Some parameters were not given.', HttpStatus.MULTIPLE_CHOICES);

                    if(!(MIN_EMAIL_L <= email.length && email.length <= MAX_EMAIL_L)
                         || !String(email).toLowerCase().match(EMAIL_REG))
                         throw new error_c('Either email is not between 8 and 40 character inclusive or it is not a valid email.', HttpStatus.MULTIPLE_CHOICES);

                    if(!(MIN_PASSWORD_L <= password.length && password.length <= MAX_PASSWORD_L))
                         throw new error_c('Password can have at least 8 character and at most 18', HttpStatus.MULTIPLE_CHOICES);

                    /* checked */

                    const user_email_q = 'SELECT * FROM users WHERE email = $1'
                    const user_email_v = [ email ]
                    const find_user_email = await query(user_email_q, user_email_v)
                    if(find_user_email.rows.length <= 0) {
                         throw new error_c('Incorrect data or user is not registered.', HttpStatus.UNAUTHORIZED);
                    }

                    const is_match = bcrypt.compareSync(password, find_user_email.rows[0].password)
                    if(!is_match) {
                         throw new error_c('Incorrect data or user is not registered.', HttpStatus.UNAUTHORIZED);
                    }    
                        
                    /* send jwt */
                    const id_user = find_user_email.rows[0].iduser
                    const token = jwt.sign({ id_user }, 'secret', {expiresIn: '2h'});
                    res.writeHead(HttpStatus.OK, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({msg: 'Success', token}));
               } catch(e) {
                    console.log(e)
                    respond_err(e, res)
               }
          })

     }

     async authenticate(req, res) {
          try {

               if(!req.headers['authorization']) {
                    throw new error_c('You need to pass the authorization header with the token', HttpStatus.UNAUTHORIZED);
               }
               
               let decoded = {};
               const token = req.headers['authorization']
               const PUB_KEY = 'secret'
               if(!(decoded = jwt.verify(token, PUB_KEY)))
				throw new error_c('Invalid token.', HttpStatus.UNAUTHORIZED);

               const id_user = decoded.id_user;
               
               const user_q = `SELECT iduser FROM users WHERE iduser = $1`;
			const user_v = [ id_user ];
			const user_query = await query(user_q, user_v);
			if(user_query.rows.length <= 0)
				throw new error_c('User not found in database. Token is invalid.', HttpStatus.UNAUTHORIZED);
               
               return id_user;

          } catch (e) {
               if(e instanceof JsonWebTokenError) {
                    res.end(JSON.stringify({msg: e.message}));
                    return
               }
               respond_err(e, res)
          }
     }
}

module.exports = user_c