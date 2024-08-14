import express from 'express';
import nunjucks from 'nunjucks';
import morgan from 'morgan';
import session from 'express-session';
// Changed 'assert' to 'with' (following two lines)
import users from './users.json' with { type: 'json' };
import stuffedAnimalData from './stuffed-animal-data.json' with { type: 'json' };

const app = express();
const port = '8000';

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: false }));

nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

function getAnimalDetails(animalId) {
  return stuffedAnimalData[animalId];
}

app.get('/', (req, res) => {
  res.render('index.html');
});

app.get('/all-animals', (req, res) => {
  res.render('all-animals.html', { animals: Object.values(stuffedAnimalData) });
});

app.get('/animal-details/:animalId', (req, res) => {
  const animalDetails = getAnimalDetails(req.params.animalId);
  res.render('animal-details.html', { animal: animalDetails });
});

app.get('/add-to-cart/:animalId', (req, res) => {
  const animalId = req.params.animalId;
  
  if (!req.session.cart) {
    req.session.cart = {};
  }

  if (!(animalId in req.session.cart)) {
    req.session.cart[animalId] = 0;
  }
  req.session.cart[animalId] += 1;

  // console.log(req.session)

  res.redirect("/cart")
});

app.get('/cart', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = {};
  }

  // Save session.cart data to cart
  const cart = req.session.cart;
  // console.log(cart);

  // Initialize an array to save animal data to
  const animals = [];

  // Initialize an order total variable
  let orderTotal = 0;

  // For every animal in cart
  for (const animal in cart) {
    // Get animal details and save to animalDetails object
    const animalDetails = getAnimalDetails(animal);
    
    // Save qty of animal in session cart
    const qty = cart[animal];
    
    // Add qty value to a new key 'qty' in animalDetails object
    animalDetails.qty = qty;
    // console.log(`Animal details:`, animalDetails);

    // Calculate subtotal 
    const subtotal = qty * animalDetails.price;

    // Add subtotal value to new key 'subtotal' in animalDetails object
    animalDetails.subtotal = subtotal;

    // Calculate order total
    orderTotal += subtotal;

    // Push animalDetails object to animals array
    animals.push(animalDetails)
  }

  res.render('cart.html', {
    animals: animals,
    orderTotal: orderTotal
  });
});

app.get('/checkout', (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect('/all-animals');
});

app.get('/login', (req, res) => {
  res.render('login.html');
});

app.post('/process-login', (req, res) => {
  const { username, password } = req.body;
  
  // Iterate through users to see if username and password match an existing user
  for (const user of users) {
    if (username === user.username && password === user.password) {
      // If username and password an existing user:
      // save username to session, got to '/all-animals' route
      // and don't do anything else
      req.session.username = username;
      res.redirect('/all-animals');
      return;
    }
  }
  // If user imput doesn't match any exiting users:
  // go back to login page an display message
  res.render('login.html', {
    message: `Incorrect username or password`
  });  
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login')
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
