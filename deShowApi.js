var request = require('request');
var querystring = require('querystring');

var deShow = 'http://listcompare.it/wp-json/wp/v2/search-properties?';

module.exports = {
	searchProperties: searchProperties
};

function searchProperties(searchParams, ind, cb) {
	var queryParams = querystring.stringify(searchParams);

	request(
	  { 
	  	url: deShow + queryParams
	  }, function (error, response, body) {
  		var bodyObj = JSON.parse(body);
  		if (ind < bodyObj.properties.length) {
  			var result = {
	  			description: bodyObj.properties[ind].post_content
	  		};

  			cb(result);
  		}

  		cb([]);  		
	  });
}

//operation_type​ :  "Venta" , "Rent+to+Own"
//type​ : "all","apartamento","casa","comercial","multi­familiar","solar","walk­up­es"
//type=casa&operation_type=venta&bedrooms=3
//bedrooms​ :  numero entero ( opcional)
//bathrooms​:  numero entero ( opcional)
//parkings​: numero entero ( opcional)
//price_range_min​ : numero entero  (default 0) ( opcional)
//price_range_max​: numero entero (default 900000) ( opcional)

//searchProperties({ 'type': 'casa', 'operation_type': 'venta', 'bedrooms': 3 }, 5, console.log);