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

exports.formatDate = function(idate){
    console.log(typeof(idate));
    idate = new Date(idate);
    var date = idate.getDate().toString() + '-' + (idate.getMonth() + 1).toString() + '-' + idate.getFullYear().toString();
    var time = idate.getSeconds().toString() + '-' + idate.getMinutes().toString() + '-' + idate.getHours().toString();
    var sdate = date + ":" + time;
    return sdate;
}

exports.formatResponse = function(response){
    for(var ride in response){
        ride.created_by = ride.username;
        delete ride.username;
        ride.timestamp = formatDate(timestamp);
    }
    return response;
}