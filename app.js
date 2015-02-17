
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , cms = require('./routes/cms')
  , http = require('http')
  , path = require('path')
  , bodyParser = require('body-parser')
  , logger = require('morgan')
  , methodOverride = require('method-override');

var app = express();
var contentBlocks = require('contentblocks')({ app: app, host: 'localhost', port: 3000, pathFind: '/cms/find?q={"@subject":"[id]"}', pathPost: '/cms', pathPut: '/cms/[id]', pathDelete: '/cms/[id]' });

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

// REST API routes.
app.get('/cms/find', cms.find);
app.get('/cms/:itemId', cms.get);
app.put('/cms/:itemId', cms.update);
app.delete('/cms/:itemId', cms.delete);
app.post('/cms', cms.insert);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
