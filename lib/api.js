var request = require('request')
  , _       = require('underscore')
  , _name_cache = {}
  , _cred = null;

var url = function(uri,parms){
  if(!_cred){
    console.log("ERROR: you must initiate api first with api.init()");
  }

  var parm_string = "/?client_id=" + _cred.id 
                  + "&api_key=" + _cred.key;

  if(parms){
     for(var m in parms){
      parm_string += "&"+m+"="+parms[m]
    }
  }
  return "https://api.digitalocean.com/" + uri + parm_string;
}

var droplet_query = function(uri,parms,cb){
  request({url:url(uri,parms), json:true},function (err, res, json) {
    if (err && !res.statusCode == 200) {
      console.log("STATUS CODE: "+res.statusCode);
      throw err;
    }
    cb(json);
  });
};

var init = exports.init = function(cred,cb){
  _cred = cred;
  droplet_query("droplets", null, function(json){
    _.each(json.droplets,function(x){
      _name_cache[x.name] = x; 
    });
    cb();
  });
};

var status = exports.status = function(cb){
  droplet_query("droplets",null,cb);
};

var power = exports.power = function(name,state,cb){
  if(_name_cache[name]){
      switch(state){

        case 'on':
          console.log('INFO: attempting to turn "'+name+'\'s" power ON');
          droplet_query("droplets/"+_name_cache[name].id+"/power_on",null,cb);
          break;

       case 'off':
          console.log('INFO: attempting to turn "'+name+'\'s" power OFF');
          droplet_query("droplets/"+_name_cache[name].id+"/power_off",null,cb);
          break;

        default:
          console.log("ERROR: power state must be 'on' or 'off' not '"+state+"'");

      }
    }else{
      console.log('ERROR: No droplet by the name of "'+name+'" sorry');
    }
}

var shutdown = exports.shutdown = function(name,cb){
  console.log('INFO: attempting to shutdown "'+name+'"');
  droplet_query("droplets/"+_name_cache[name].id+"/shutdown",null,cb);
};

var snapshot = exports.snapshot = function(dname,sname,cb){
   console.log('INFO: attempting to create a snapshot of "'
              +dname+'" called "'+sname+'"');
  droplet_query("droplets/"+_name_cache[dname].id+"/snapshot",{
    name:sname
  },cb);
};



/**
 * Image API calls
 */

var images = exports.images = function(cb){
  droplet_query("images",null,cb);
}

var destroy_image = exports.destroy_image = function(id, cb){
  droplet_query("images/"+id+"/destroy",null,cb);
}
