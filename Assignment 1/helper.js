exports.validPass = function (password) {
    if (password.length === 40) {
        regexp = /^[0-9a-fA-F]+$/;
        if (regexp.test(password)) {
            return true;
        }
    }
    return false;
};

exports.extractDate = function(sdate){
    var ndate = sdate.split(":");
    var date = ndate[0].split("-");
    var time = ndate[1].split("-");
    ndate[0] = date[1] + '/' + date[0] + '/' + date[2];
    ndate[1] = time[2] + ':' + time[1] + ':' + time[0];
    ndate = ndate.join(" ");
    return ndate;   
}

exports.isInvalid = function(date){
    ndate = new Date(date);
    if(ndate.getMonth() + 1 != date.slice(0,2)){
        return true;
    }
    return false;
}

exports.formatDate = function(idate){
    console.log(typeof(idate));
    console.log(idate);
    idate = new Date(idate);
    var date = ("0" + idate.getDate()).slice(-2) + '-' + ("0" + (idate.getMonth() + 1)).slice(-2) + '-' + ("000" + idate.getFullYear()).slice(-4);
    var time = ("0" + idate.getSeconds()).slice(-2) + '-' + ("0" + idate.getMinutes()).slice(-2) + '-' + ("0" + idate.getHours()).slice(-2);
    var sdate = date + ":" + time;
    return sdate;
}

exports.formatResponse = function(response){
    for(var i = 0; i < response.length; i++){
        console.log(response[i]);
        response[0]['username'] = response[0].created_by;
        delete response[0].created_by;
        response[0].timestamp = this.formatDate(response[0].timestamp);
    }
    return response;
}