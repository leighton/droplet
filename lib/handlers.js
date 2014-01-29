/**
 * Handlers for the client i.e. functions that convert 
 * API responses into something visual.
 */

var _         = require("underscore")
  , Table     = require('cli-table')
  , colors    = require('colors'); 

exports.print = function(res,cmd){
  console.log(res);
};


exports.tabulate_status = function(res, cmd){
  if(res.droplets){
    
    var droplets = _.sortBy(res.droplets, function(x){
      return x.status;
    });

    var table = new Table({
      head: ['ID', 'NAME', 'IP ADDRESS', 'STATUS'], 
      colWidths: [10,20,20,10]
    });
    
    _.each(droplets, function(x){
      table.push(
        [x.id, x.name, x.ip_address, x.status==="off" ? x.status.yellow : x.status.green]
      );
    });
    
    console.log(table.toString()); 
  }
};


exports.tabulate_images = function(res, cmd){
  
  if(res.images){
    var table = new Table({
      head: ['ID', 'PUBLIC', 'OS', 'NAME'], 
      colWidths: [10,10,15,30]
    });

    _.each(res.images,function(x){
      if(cmd.all){
        table.push(
          [x.id, x.public, x.distribution, x.name]
        );
      }else{
        if(!x.public){
          table.push(
            [x.id, x.public, x.distribution, x.name]
          );
        }
      }
    });
    
    console.log(table.toString());
  }
};
