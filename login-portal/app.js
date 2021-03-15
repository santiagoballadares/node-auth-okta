var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var okta = require('@okta/okta-sdk-nodejs');
var ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;

var dashboardRouter = require('./routes/dashboard');
var publicRouter = require('./routes/public');
var usersRouter = require('./routes/users');

var app = express();
var oktaClient = new okta.Client({
  orgUrl: 'https://dev-295644.okta.com',
  token: '00fs32YBOeRznHKK5IJMybhoo8q1xMfmtB2tKI1amE',
});
var oidc = new ExpressOIDC({
  issuer: 'https://dev-295644.okta.com/oauth2/default',
  client_id: '0oan6ytjbKZou4kh9356',
  client_secret: 'loxRcAv0tqgumjsovkPX6AY4BxfIOfnifRm3Py2G',
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: 'openid profile',
  routes: {
    login: {
      path: '/users/login',
    },
    callback: {
      path: '/users/callback',
      defaultRedirect: '/dashboard',
    },
  },
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ssTSmkfdwjsfsdkrojfioweyfhd',
  resave: true,
  saveUninitialized: false
}));
app.use(oidc.router);
app.use((req, res, next) => {
  if (!req.userContext) {
    return next();
  }

  oktaClient.getUser(req.userContext.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});

function loginRequired(req, res, next) {
  if (!req.userContext) {
    return res.status(401).render('unauthenticated');
  }
  next();
}

app.use('/', publicRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
