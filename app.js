
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , bodyParser = require('body-parser')
  , logger = require('morgan')
  , methodOverride = require('method-override');

var app = express();
var contentBlocks = require('contentblocks')({ app: app, host: 'red-ant.herokuapp.com', port: 80, pathFind: '/v1/nest/find?q={"@subject":"[id]"}', pathPost: '/v1/nest', pathPut: '/v1/nest/[id]', pathDelete: '/v1/nest/[id]' });

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(contentBlocks.render);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') == 'development') {
	app.locals.pretty = true;
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
