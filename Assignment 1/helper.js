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
    var sdate = date.split(" ");
    var  date = sdate[0].split("/");
    var time= sdate[1].split(":");
    sdate[0] = date[1]+'-'+date[0]+'-'+date[2];
    sdate[1] = time[2]+'-'+time[1]+'-'+time[0];
    sdate =sdate.join(':');
    return sdate;
}