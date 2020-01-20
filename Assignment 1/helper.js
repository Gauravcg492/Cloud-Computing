exports.validPass = function (password) {
    if (password.length === 40) {
        regexp = /^[0-9a-fA-F]+$/;
        if (regexp.test(password)) {
            return true;
        }
    }
    return false;
};