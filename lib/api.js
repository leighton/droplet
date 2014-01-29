var request = require('request')
  , _       = require('underscore')
  , _name_cache = {} //TODO: move away from the cache, it's stupid.
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


var api_query = function(uri,parms,cb){
  request({url:url(uri,parms), json:true},function (err, res, json) {
    if (err && !res.statusCode == 200) {
      console.log("STATUS CODE: "+res.statusCode);
      throw err;
    }

    if (json.status === 'ERROR'){
      throw Error(json.error_message);
    }
    cb(json);
  });
};


var on_complete = function(res, next){

  events(res.event_id,function(evt){
      
    if(evt.event.action_status==='done'){
      next()
    }else{
      on_complete(res, next);
    }
    
  });
  
};


var init = exports.init = function(cred,cb){
  _cred = cred;
  api_query("droplets", null, function(json){
    _name_cache = _.indexBy(json.droplets,'name');
    cb();
  });
};


/**
 * Droplet API
 */
var status = exports.status = function(expr, cb){
  
  if ('string' === typeof expr) {
    //TODO: check that droplet actually exists by that name
    api_query("droplets/"+_name_cache[expr].id, null, cb);
      
  } else if ('number' === typeof expr) {
    
     api_query("droplets/"+expr, null, cb);
    
  } else if ('function' === typeof expr && cb === undefined){
    
    cb = expr;
    api_query("droplets", null, cb);

  } else {
    //TODO: this is to stop the client from crashing
    //throw Error("Unable to coerce arguments");

  }

};

var power = exports.power = function(name,state,cb){
  if(_name_cache[name]){
      switch(state){

        case 'on':
          console.log('INFO: attempting to turn "'+name+'\'s" power ON');
          api_query("droplets/"+_name_cache[name].id+"/power_on",null,cb);
          break;

       case 'off':
          console.log('INFO: attempting to turn "'+name+'\'s" power OFF');
          api_query("droplets/"+_name_cache[name].id+"/power_off",null,cb);
          break;

        default:
          console.log("ERROR: power state must be 'on' or 'off' not '"+state+"'");

      }
    }else{
      console.log('ERROR: No droplet by the name of "'+name+'" sorry');
    }
}

var shutdown = exports.shutdown = function(name,cb){
  console.log('INFO: Attempting to shutdown "'+name+'"');
  api_query("droplets/"+_name_cache[name].id+"/shutdown",null,cb);
};

var snapshot = exports.snapshot = function(dname,sname,cb){
   console.log('INFO: Attempting to create a snapshot of "'
              +dname+'" called "'+sname+'"');
  api_query("droplets/"+_name_cache[dname].id+"/snapshot",{
    name:sname
  },cb);
};

var destroy = exports.destroy = function(dname, cb){

  console.log('INFO: Attempting to destroy droplet: '+dname);
  api_query("droplets/"+_name_cache[dname].id+"/destroy",{
    scrub_data : true
  },cb);

}

var restore = exports.restore = function(dname, iname, cb){
 
  var do_restore = function(){
    //console.log(size);
    //console.log(image);
    //console.log(region);
    console.log(
      "INFO: Attempting to restore '%s' with '%s' in '%s'", 
      image.name, size.name, region.slug
    );
    
  
    api_query("droplets/new",{
      name : dname,
      size_id : size.id,
      image_id : image.id,
      region_id : region.id,
      private_networking : false,
      backups_enabled : false 
    },
    cb);
    
  }
 
  var size = null
    , image = null
    , region = null
    , finished = _.after(3, do_restore);  
  
  sizes(function(res){
    
    size = _.findWhere(res.sizes, { name : "512MB" });    
    finished();

  });

  regions(function(res){

    region = _.findWhere(res.regions, {slug : "sfo1" });
    finished();
  
  });

  images(true,function(res){

    image = _.findWhere(res.images,{name : iname});
    finished();

  });


}


/**
 * Regions API
 */
var regions = exports.regions = function(cb){
  
  api_query("regions", null, cb);

}


/**
 * Image API calls
 */

var images = exports.images = function(private, cb){
  
  var parms = {
    filter : (private) ? "my_images" : "global"
  }
  api_query("images", parms, cb);

};

var destroy_image = exports.destroy_image = function(id, cb){
  
  api_query("images/"+id+"/destroy",null,cb);

}


/**
 * SSH keys API
 */
//TODO complete


/**
 *  Sizes API
 */
var sizes = exports.sizes = function(cb){
  
  api_query("sizes", null, cb);

};


/**
 * Domains API
 */
//TODO: complete


/**
 * Events API
 */
var events = exports.events = function(id,cb){
  
  api_query("events/"+id, null, cb);
  
};


/**
 * Composite API calls
 */
var ice = exports.ice = function(dname,cb){ 

  power(dname, 'off', function(res){
    
    on_complete(res, function(){
      
      console.log("INFO: Power off was successfull");

      snapshot(dname, dname+"$iced", function(res){
        
        on_complete(res, function(){

          console.log("INFO: Snapshot was created");
          
          destroy(dname, function(res){
            
            on_complete(res, function(){
              console.log("INFO: Droplet was destroyed, R.I.P. %s ", dname);
            });

          });
          
        });     
    
      })

    });
  
  });

};

var thaw = exports.thaw = function(dname,cb){
  
  restore(dname, dname+"$iced", function(res){
    
    on_complete(res.droplet, function(){

      console.log("INFO: Restore complete");
      console.log("INFO: Attempting to determine status of droplet");

      status(res.droplet.id, function(res){

          if(res.droplet.status === 'active'){
            
            console.log("INFO: It's Alive (and active)! Droplet '%s' "+
                        "was thawed and is now running ", res.droplet.name);
            console.log("INFO: Attempting to destroy iced snapshot '%s'", 
                        res.droplet.name+"$iced")
            
            destroy_image(res.droplet.image_id, function(res){
              
              console.log("INFO: Snapshot destroyed");
              console.log("INFO: Thaw completed");
              cb(res);
            
            });

          }else{
            console.log("ERROR: Something is fishy, your instance is "+
                        "not active, iced image was not deleted as a precaution");
            console.log("INFO: Snapshot was not destroyed, manually check what is going on");
          }

      });
      
    });

  });

};


