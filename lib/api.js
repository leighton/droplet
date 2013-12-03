var request = require('request')
  , _       = require('underscore')
  , _name_cache = {}
  , _cred = null;

var url = function(uri){
  if(!_cred){
    console.log("ERROR: you must initiate api first with api.init()");
  }
  return "https://api.digitalocean.com/"
       + uri
       + "/?client_id=" + _cred.id 
       + "&api_key=" + _cred.key;
}

var droplet_query = function(uri,cb){
  request({url:url(uri), json:true},function (err, res, json) {
    if (err && !res.statusCode == 200) {
      console.log("STATUS CODE: "+res.statusCode);
      throw err;
    } 
    cb(json);
  });
};

var init = exports.init = function(cred,cb){
  _cred = cred;
  droplet_query("droplets", function(json){
    _.each(json.droplets,function(x){
      _name_cache[x.name] = x; 
    });
    cb();
  });
};

var shutdown = exports.shutdown = function(name,cb){
  console.log('INFO: attempting to shutdown "'+name+'"');
  droplet_query("droplets/"+_name_cache[name].id+"/shutdown",cb);
};

var info = exports.info = function(cb){
  droplet_query("droplets",cb);
};

var power = exports.power = function(name,state,cb){
  if(_name_cache[name]){
      switch(state){

        case 'on':
          console.log('INFO: attempting to turn "'+name+'\'s" power ON');
          droplet_query("droplets/"+_name_cache[name].id+"/power_on",cb);
          break;

       case 'off':
          console.log('INFO: attempting to turn "'+name+'\'s" power OFF');
          droplet_query("droplets/"+_name_cache[name].id+"/power_off",cb);
          break;

        default:
          console.log("ERROR: power state must be 'on' or 'off' not '"+state+"'");

      }
    }else{
      console.log('ERROR: No droplet by the name of "'+name+'" sorry');
    }
}
